# Advisor Tool Implementation Analysis
*Compiled 2026-04-09 — 3 analysis teams, 9 parallel agents analyzing `docs/advisor-tool-research.md`*

> **Bottom line up front:** The advisor pattern is already partially implemented via the skills system. The optimal implementation is a 3-layer stack — **Hooks (hard guardrails) + Skills (domain guidance) + Native Subagent (complex reasoning)** — with an optional MCP layer only if rules become dynamic. Build the hook layer first; it is the only unbypassable enforcement mechanism.

---

## Table of Contents

1. [Pattern Selection: Why Advisor, Not Critic/Evaluator/Reviewer](#1-pattern-selection)
2. [Primary Recommendation: Implementation Approach](#2-primary-recommendation)
3. [The 3-Layer Hybrid Architecture](#3-the-3-layer-hybrid-architecture)
4. [Layer 1 — Hooks Implementation (Build First)](#4-layer-1--hooks-implementation)
5. [Layer 2 — Skills-Based Advisor (Build Second)](#5-layer-2--skills-based-advisor)
6. [Layer 3 — MCP Server (Build If Needed)](#6-layer-3--mcp-server-build-if-needed)
7. [Layer 4 — Native Subagent (Reserve for Complex Decisions)](#7-layer-4--native-subagent)
8. [Critical Gaps in the Research Doc](#8-critical-gaps-in-the-research-doc)
9. [Open Questions Before Implementation](#9-open-questions-before-implementation)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Pattern Selection

**Verdict: The Advisor pattern is the correct choice.**

The research doc describes four patterns — Advisor, Critic, Evaluator, Reviewer. The Advisor is the only one that operates pre-action, before Claude commits to a tool call. In Claude Code's turn-based interactive model, post-generation patterns (Critic, Evaluator, Reviewer) would require a completed output before any guidance is issued — wasting inference and potentially requiring rollback of already-executed tool calls (Bash commands, file writes).

Key characteristics that make Advisor the fit:
- **Timing:** Pre-action or concurrent — aligns with guiding Claude before it acts
- **Mode:** Constructive and forward-looking — tells Claude what *to do*, not what went wrong
- **Read-only:** No write access, safe to compose into Claude Code's tool environment

**What it is not suited for:** Post-execution quality scoring or pass/fail assessment — that is Evaluator/Reviewer territory.

---

## 2. Primary Recommendation

**Primary: Skills-based advisor + Hooks**
**Secondary: MCP (only if rules need to be dynamic or pulled from external sources)**
**Reserve: Native subagent (only for high-stakes decisions requiring multi-step reasoning)**

### Why not MCP as primary?

One agent (Team 1, Agent 2) recommended MCP as primary, citing that it is visible to Claude and works across both interactive and subagent contexts. This is technically correct. However, Team 3, Agent 3 surfaced a compelling counter-argument:

> *"The skills system is already an advisor pattern. The right move is a project-level `.claude/skills/advisor.md`... No MCP server needed unless advisory content becomes dynamic."*

And Team 3, Agent 2 (gaps analysis) surfaced the most critical flaw in the MCP-first approach:

> *"Claude Code's tool invocation is probabilistic and context-sensitive. There is no guaranteed mechanism to force invocation — a model under time pressure, token budget limits, or with a competing instruction in CLAUDE.md may skip the advisory tool entirely."*

**The decisive point:** MCP description-driven invocation is probabilistic, not a contract. If the advisor is a security gate, probabilistic invocation is not sufficient. Hooks are the only hard guarantee. Skills are free, zero-infrastructure, and already work. MCP adds process management complexity and a build artifact lifecycle problem without adding hard enforcement.

**Use MCP when:** Advisory content must be fetched from a live external source (team knowledge base, Supabase rules table, GitHub PR state). Not before.

### Decision Rule

> Use **Hooks** when you need to enforce rules that must fire regardless of Claude's reasoning.
> Use **Skills** when you need Claude to reason about constraints before acting.
> Use **MCP** when advisory content is dynamic and cannot live in a markdown file.
> Use a **Native Subagent** when the advisory decision requires stateful, multi-step reasoning about tradeoffs.

---

## 3. The 3-Layer Hybrid Architecture

```
Claude proposes an action
        |
        v
[Layer 1: Hooks — PreToolUse]        ← MANDATORY, opaque, unbypassable
  Dangerous pattern?  → BLOCK (exit 1, return message to Claude)
  Out-of-scope path?  → BLOCK
  Migration file edit? → BLOCK
  Passes cleanly?     → continue
        |
        v
[Layer 2: Skill — heatsheet:advisor]  ← VOLUNTARY, visible, reasoned
  Claude invokes before high-stakes tasks:
  - creating new packages or apps
  - modifying public APIs or interfaces
  - cross-package changes
  Returns: APPROVED / REVISE(instructions) / ESCALATE(why)
        |
        v
[Layer 3: MCP — get_project_rules]    ← OPTIONAL, visible, dynamic
  Only if rules are live/external.
  Claude calls with topic filter.
  Returns domain constraints as text.
        |
        v
[Layer 4: Native Subagent — on-demand]  ← RESERVED, expensive
  Orchestrator detects architectural ambiguity.
  Receives: full task + plan + constraints bundle.
  Returns: { decision, reasoning, suggested_revision }
  Hard cap: 3 REVISE loops, then escalate to Ari.
        |
        v
[Execution proceeds]
        |
        v
[Layer 1: Hooks — PostToolUse]       ← MANDATORY, non-blocking audit log
  Logs every tool call with timestamp.
  Exit 0 always.
```

### Layer Comparison

| Layer | Mechanism | Visible to Claude | Blocks? | Latency | Guards |
|-------|-----------|:-----------------:|:-------:|---------|--------|
| 1a | Hook `PreToolUse` | No | Yes (hard) | ~5ms | CLAUDE.md hard rules, scope, dangerous commands |
| 2 | Skill `heatsheet:advisor` | Yes | Soft (REVISE loop) | ~0ms (in-context) | Project constraints, API changes, architecture |
| 3 | MCP `get_project_rules` | Yes | No (advice only) | ~20ms | Dynamic rules from external source |
| 4 | Native Subagent | Yes | Soft (REVISE loop) | ~2–5s | Complex tradeoffs, architectural decisions |
| 1b | Hook `PostToolUse` | No | No | ~5ms | Audit log |

**Build priority: 1a → 2 → 1b → 3 (if needed) → 4 (if needed)**

---

## 4. Layer 1 — Hooks Implementation

Hooks are the safety net everything else relies on. Build this first.

### File Structure

```
/root/code/heatsheet/
  .claude/
    settings.json          ← hook configuration (project-level, commit this)
    hooks/
      pre-bash-guard.sh    ← blocks dangerous shell commands
      pre-file-guard.sh    ← scope guard + migration protection
      post-audit.sh        ← non-blocking audit log
    audit.log              ← gitignored; runtime output only
```

Add to `.gitignore`:
```
.claude/audit.log
```

### `.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/root/code/heatsheet/.claude/hooks/pre-bash-guard.sh"
          }
        ]
      },
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "/root/code/heatsheet/.claude/hooks/pre-file-guard.sh"
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "/root/code/heatsheet/.claude/hooks/pre-file-guard.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "/root/code/heatsheet/.claude/hooks/post-audit.sh"
          }
        ]
      }
    ]
  }
}
```

### `pre-bash-guard.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')

DANGEROUS_PATTERNS=(
  'rm -rf'
  'git push --force[^-]'
  'git push --force$'
  'git commit'
  'git add'
  'DROP TABLE'
  'DROP SCHEMA'
  'supabase db reset'
  'supabase db push --linked'
  'npm publish'
  'sudo '
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if printf '%s' "$COMMAND" | grep -qE "$pattern"; then
    printf 'ADVISOR BLOCK: Command matches dangerous pattern "%s".\n' "$pattern"
    printf 'Per project rules, this command must be run manually by the user. State your intent and ask Ari to run it.\n'
    exit 1
  fi
done

# Warn on direct DB access outside Supabase CLI
if printf '%s' "$COMMAND" | grep -qE 'psql|pg_dump|pg_restore'; then
  printf 'ADVISOR BLOCK: Direct database command detected outside Supabase CLI.\n'
  printf 'Use the Supabase CLI for all database operations. Ask Ari if you need raw psql access.\n'
  exit 1
fi

exit 0
```

### `pre-file-guard.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
PROJECT_ROOT="/root/code/heatsheet"

# Block edits outside project root
if [[ -n "$FILE" && "$FILE" != "$PROJECT_ROOT"* ]]; then
  printf 'ADVISOR BLOCK: File path "%s" is outside the project root.\n' "$FILE"
  printf 'All edits must stay within %s. Confirm with Ari before touching external files.\n' "$PROJECT_ROOT"
  exit 1
fi

# Block edits to existing migration files (append-only by convention)
if printf '%s' "$FILE" | grep -qE 'supabase/migrations/'; then
  printf 'ADVISOR BLOCK: Editing an existing migration file is destructive.\n'
  printf 'Migration files are append-only. Create a new migration file instead.\n'
  exit 1
fi

# Block direct edits to .env files
if printf '%s' "$FILE" | grep -qE '(^|/)\.env(\.|$)'; then
  printf 'ADVISOR BLOCK: .env files must never be edited by Claude per project rules.\n'
  exit 1
fi

# Flag schema-adjacent file edits (warn, not block — exit 1 to surface advisory)
if printf '%s' "$FILE" | grep -qE '(packages/db/|supabase/seed)'; then
  printf 'ADVISOR WARNING: This file affects shared DB schema or seed data.\n'
  printf 'Confirm downstream packages (apps/web, apps/mobile) have been updated and flag this change to Ari.\n'
  exit 1
fi

exit 0
```

### `post-audit.sh`

```bash
#!/usr/bin/env bash
INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // "unknown"')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE="/root/code/heatsheet/.claude/audit.log"

printf '%s\t%s\n' "$TIMESTAMP" "$TOOL" >> "$LOG_FILE"
exit 0
```

Make all scripts executable:
```bash
chmod +x .claude/hooks/pre-bash-guard.sh .claude/hooks/pre-file-guard.sh .claude/hooks/post-audit.sh
```

### Critical Hook Warning (from gaps analysis)

> **Verify the stdin schema before relying on it.** The hook input format shown above (`tool_name`, `tool_input`) is what the research doc documented, but the actual Claude Code payload may include additional fields. Add a logging step first to capture real payloads:
>
> ```bash
> # Temporary debug hook — run this before any real guards
> cat >> /tmp/claude-hook-debug.log
> exit 0
> ```

Also: **wrap scripts with a timeout** to prevent hanging on any external call:
```json
"command": "timeout 5s /root/code/heatsheet/.claude/hooks/pre-bash-guard.sh"
```

---

## 5. Layer 2 — Skills-Based Advisor

The skills system is already an advisor pattern. The `superpowers:brainstorming`, `superpowers:writing-plans`, and `superpowers:systematic-debugging` skills all operate pre-action, are constructive and forward-looking, and have no write access — exactly matching the Advisor definition.

**The key insight:** Don't build a new advisor system; extend the existing skills system with a project-specific advisor skill.

### Create `.claude/skills/advisor.md`

```markdown
---
name: heatsheet-advisor
description: Use before creating new packages, modifying public APIs, making cross-package changes, or any action touching Supabase schema. Returns APPROVED, REVISE, or ESCALATE.
type: advisor
---

# Heatsheet Project Advisor

You are consulting the heatsheet project advisor. Evaluate the proposed action or plan against the constraints below and return a structured decision.

## Project Constraints

**Monorepo boundaries:**
- `apps/` — application layer; may import from `packages/`
- `packages/` — shared library layer; must NOT import from `apps/`
- `supabase/` — database layer; schema changes require a new migration file

**Data safety:**
- Never expose raw DB models or row objects in API responses
- All authentication must flow through the project auth middleware
- Use Zod for all external input validation
- Never hardcode secrets, API keys, or credentials

**Change management:**
- Changes to any public API or function signature must be flagged to Ari before implementation
- Changes to `packages/` require updating `docs/` in the same task
- New Supabase tables require: migration file + RLS policy + type generation

**Scope:**
- Never edit outside `/root/code/heatsheet`
- Never edit `.env` files
- Never commit — Ari handles all commits

## Your Response Format

Return ONLY one of these three structures:

**If the plan is safe to proceed:**
APPROVED: [one-sentence rationale]

**If the plan needs adjustment:**
REVISE: [specific instruction — what must change before proceeding]

**If human judgment is required:**
ESCALATE: [why this decision needs Ari's input]

Do not take any actions. Do not write files. Return only the structured decision.
```

### Integration Points (When to Invoke)

Invoke `heatsheet:advisor` (via the Skill tool) before:
- Creating a new package or app directory
- Modifying a public API, exported type, or function signature
- Adding or modifying Supabase tables, RLS policies, or migrations
- Any change that crosses package boundaries (`apps/` ↔ `packages/`)
- After `superpowers:writing-plans` produces a plan, before `superpowers:executing-plans` begins

Do NOT invoke on every micro-step — reserve it for architectural and cross-cutting decisions.

### REVISE Loop Management

If the advisor returns REVISE, the orchestrator must:
1. Pass the original plan + REVISE feedback to the planner
2. **Pass the full revision history** (not just the latest feedback) on each retry
3. Cap at **3 REVISE loops** — on the 4th, surface the last `reasoning` to Ari and stop

```
Revision 1: Pass [original task, feedback-1]
Revision 2: Pass [original task, feedback-1, revised-plan-1, feedback-2]
Revision 3: Pass [original task, feedback-1, revised-plan-1, feedback-2, revised-plan-2, feedback-3]
Revision 4: ESCALATE to Ari with full history
```

---

## 6. Layer 3 — MCP Server (Build If Needed)

Build the MCP advisor server **only when** the project advisor skill's rules need to come from a live external source (Supabase table of architectural decisions, team knowledge base, GitHub PR state).

If you build it, it lives at `packages/advisor/` in the monorepo.

### Critical Gap: Build Lifecycle

The MCP server compiles to `dist/index.js`. Claude Code runs the compiled artifact. If a developer edits `src/rules.ts` and does not rebuild, Claude Code silently runs stale advice with no error.

**Required:** Add `packages/advisor` to the Turborepo pipeline:
```json
// turbo.json
{
  "pipeline": {
    "@heatsheet/advisor#build": {
      "outputs": ["dist/**"]
    }
  }
}
```

### Tool Descriptor (use imperative language)

```json
{
  "name": "get_project_rules",
  "description": "Returns architectural rules, coding conventions, and module boundaries for the heatsheet monorepo. Call this before: creating a new package or app, modifying a shared package API, adding a new Supabase table or RLS policy, or making any change that crosses package boundaries.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic": {
        "type": "string",
        "description": "Filter by domain: 'database', 'auth', 'api', 'ui', 'packages', 'general'"
      }
    }
  }
}
```

### `packages/advisor/tsconfig.json` Note

Override `module`/`moduleResolution` to `NodeNext` — the root tsconfig uses `bundler` resolution which does not apply to a Node.js stdio process:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

---

## 7. Layer 4 — Native Subagent

Reserve the native subagent for advisory tasks that require multi-step reasoning about tradeoffs — things the skills layer cannot resolve mechanically.

### When to Use

**Use native subagent when:**
- The decision requires comparing architectural options (not just checking constraints)
- The context to evaluate is large and heterogeneous (code + schema + constraints together)
- The advisor needs to produce specific, actionable revision instructions
- The decision is high-stakes and rare enough that full LLM inference cost is acceptable

**Do NOT use when:**
- Simple rule enforcement (use hooks)
- Static constraint checking (use the advisor skill)
- High-frequency, low-stakes decisions (too expensive)

### Wiring into the Dispatch Flow

```
Turn N:
  Orchestrator receives task
  → Worker subagent dispatched → returns proposed plan
  → [advisor step] Advisor subagent dispatched (blocking, NOT run_in_background)
  → Orchestrator branches on JSON response
  → Executor proceeds or loops back to worker
```

### Advisor Subagent Prompt Template

```
You are an advisor agent. Your only job is to evaluate the proposed plan below
and return a structured decision. You do not take actions, write files, run
commands, or modify anything. You have no tools.

Return ONLY valid JSON:
{
  "decision": "APPROVE" | "REVISE" | "REJECT",
  "reasoning": "<concise explanation>",
  "suggested_revision": "<specific instruction to worker, or null>"
}

TASK GOAL: [original user intent]

PRIOR STEPS TAKEN:
[numbered list of completed steps]

PROPOSED ACTION / PLAN:
[exact plan or code from worker subagent]

PROJECT CONSTRAINTS:
[paste relevant CLAUDE.md rules verbatim]

REVISION ATTEMPT: [N of 3]
```

**Hard rule:** Cap at 3 REVISE loops. On the 4th, surface the last `reasoning` to Ari and stop. Track the revision counter explicitly in the orchestrator's prompt narrative — there is no framework-level guard.

---

## 8. Critical Gaps in the Research Doc

The gaps analysis (Team 3, Agent 2) identified these issues with `docs/advisor-tool-research.md`:

### Gap 1: MCP Invocation is Probabilistic (Highest Impact)

The research doc presents description-driven MCP invocation as a reliable contract. **It is not.** A model under time pressure, token budget limits, or with competing instructions may skip the advisory tool entirely. This means:

- MCP-based advisory is for *guidance injection*, not *enforcement*
- Enforcement requires hooks — they are the only hard guarantee
- Never use MCP alone as a security gate

### Gap 2: Hook Stdin Schema May Be Incomplete

The doc's hook input format (`tool_name`, `tool_input`) may be a subset of the actual payload Claude Code sends. **Before writing production hook scripts, capture a real payload:**

```bash
# Temporary debug hook
cat >> /tmp/claude-hook-debug.log
exit 0
```

Run a few tool calls with this hook active, then inspect `/tmp/claude-hook-debug.log` to see the full payload structure.

### Gap 3: Hook Timeout Behavior Undocumented

The doc says "keep hooks fast" but doesn't explain what happens when a hook hangs. Always wrap hook scripts:

```json
"command": "timeout 5s /path/to/hook.sh"
```

Design hooks to fail-closed (non-zero exit on timeout) — when in doubt, block rather than silently allow.

### Gap 4: Prompt Injection via Advisor Responses

MCP advisors that pull from external sources (team knowledge bases, files, DBs) are a prompt injection surface. The advisory content is injected directly into Claude's reasoning. Mitigation:
- Bound advisory response length
- Use structured JSON responses, not freeform text
- Source rules from immutable or access-controlled stores
- Never render attacker-influenced content as instructions

### Gap 5: REVISE Loop Needs Full History

The research doc's pseudocode passes only the latest feedback on each REVISE iteration. This allows the planner to produce identical plans on retry (no memory of what was tried). **Always pass the full revision history** on each retry (see Section 5 above).

---

## 9. Open Questions Before Implementation

**The one critical unanswered question** (from gaps analysis):

> *What is the actual behavior when a `PreToolUse` hook exits non-zero? Does Claude Code treat it as a hard stop for that action, or does Claude attempt to route around it by using a semantically equivalent but differently-phrased command?*

This must be verified empirically before any security-sensitive hook is deployed. If Claude can bypass hook blocks by rephrasing, the entire hook-based security model is weakened.

**Recommended test:** Write a hook that blocks any Bash command containing the word "test". Then ask Claude to run tests. Observe whether Claude: (a) stops and reports the block to you, or (b) tries alternative phrasings like `npm run test` → `jest` → `npx jest`.

---

## 10. Implementation Roadmap

### Phase 1: Hooks (build now)
1. Create `.claude/hooks/` directory
2. Write `pre-bash-guard.sh` — block CLAUDE.md hard rules
3. Write `pre-file-guard.sh` — scope guard, .env protection, migration protection
4. Write `post-audit.sh` — non-blocking audit log
5. Configure `.claude/settings.json` with all hooks
6. **Run empirical test** to verify hook stdin schema and bypass behavior
7. Add `audit.log` to `.gitignore`

### Phase 2: Skills Advisor (build next)
1. Create `.claude/skills/advisor.md` with project constraints in APPROVE/REVISE/ESCALATE format
2. Update `superpowers:writing-plans` workflow (if customized) to invoke advisor after plan generation
3. Document in CLAUDE.md: when to invoke the advisor skill

### Phase 3: MCP (only if rules go dynamic)
1. Create `packages/advisor/` with MCP server
2. Add to Turborepo pipeline
3. Register in `.claude/settings.json`
4. Migrate static skill rules to dynamic server only if dynamic sourcing adds clear value

### Phase 4: Native Subagent (only for complex decisions)
1. No infrastructure needed — just orchestrator prompt patterns
2. Document the advisor subagent prompt template in the relevant skills/workflows
3. Add the 3-loop cap pattern to any orchestration that might trigger advisory reasoning

---

*Source: Analysis of `docs/advisor-tool-research.md` by 9 parallel agents across 3 teams. All agents read the same source doc from different analytical angles. Conflicts between agent recommendations are resolved by the synthesis in Section 2.*
