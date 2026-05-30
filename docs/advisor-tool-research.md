# Advisor Tool Research
*Compiled 2026-04-09 — 3 research teams, 9 parallel agents*

> **Key Finding:** "Advisor tool" is not an official Anthropic API primitive. It is an architectural pattern — a role that a Claude agent, MCP tool, or hook script plays in a larger system. This document covers what the pattern is, how it compares to related patterns, and concrete implementation paths in Claude Code and multi-agent systems.

---

## Table of Contents

1. [What is the Advisor Tool Pattern?](#1-what-is-the-advisor-tool-pattern)
2. [Advisor vs. Related Patterns](#2-advisor-vs-related-patterns)
3. [Implementation in Multi-Agent Systems](#3-implementation-in-multi-agent-systems)
4. [Implementation via MCP Server](#4-implementation-via-mcp-server)
5. [Implementation via Claude Code Hooks](#5-implementation-via-claude-code-hooks)
6. [Comparison: MCP vs Hooks vs Native Agent](#6-comparison-mcp-vs-hooks-vs-native-agent)
7. [Framework Support](#7-framework-support)
8. [Best Practices](#8-best-practices)

---

## 1. What is the Advisor Tool Pattern?

An **advisor** is a non-executing agent or tool whose sole purpose is to return guidance — not to take actions. It is consulted by an orchestrator or worker agent to:

- Validate a plan before it is executed
- Flag risks in a proposed action
- Inject domain knowledge or constraints
- Resolve ambiguity before a decision is committed

**Timing:** Pre-action or concurrent with action generation (preventive), not post-hoc.

**Key characteristic:** The advisor has no write access to the world. It reads context and returns a decision or recommendation. This boundary is what distinguishes it from a worker agent.

### What Anthropic Provides

Anthropic does not have an API primitive called "advisor tool." The closest official concepts are:

- **Tool use / function calling** — the mechanism by which any advisor tool is exposed
- **Orchestrator/subagent patterns** — documented in the multi-agent section; a Claude instance in an "advisor" role is a specific application of this pattern
- **MCP servers** — the recommended way to expose custom tools (including advisor tools) to Claude Code
- **Hooks** — lifecycle events in Claude Code that enable external scripts to intercept tool calls

The advisor framing is a community and architectural convention built on top of these primitives.

---

## 2. Advisor vs. Related Patterns

These four patterns are related but serve distinct roles:

| Pattern | Timing | Mode | Focus |
|---------|--------|------|-------|
| **Advisor** | Pre-action | Constructive | What to do / consider |
| **Critic** | Post-generation | Adversarial | What is wrong |
| **Evaluator** | Post-generation | Quantitative | Score / pass/fail |
| **Reviewer** | Post-generation, final | Holistic | Correctness + style + completeness |

### Advisor
- Proactively offers guidance before or during task execution
- Forward-looking and constructive — tells the agent what *to* do
- Reduces bad outputs before they happen; lower correction overhead
- **Weakness:** Can add noise if triggered too frequently; may not catch errors that only manifest after execution

### Critic
- Evaluates a completed output and provides corrective feedback
- Adversarial — explicitly looks for flaws
- Used in iterative refinement loops (Constitutional AI, self-critique, LangChain's `LLMCheckerChain`)
- **Weakness:** Requires a full generation first (costly); may over-criticize

### Evaluator
- Scores or classifies output against defined rubrics
- Neutral and quantitative — produces scores, pass/fail, structured assessments
- Used in CI/CD pipelines, LLM-as-judge setups (RAGAS, Braintrust)
- **Weakness:** Rubric quality determines usefulness; misses nuanced qualitative failures

### Reviewer
- Holistic final gate before delivery — approve, request changes, or annotate
- Mimics human editorial judgment
- Used in PR review agents (CodeRabbit, Sweep), legal/medical document review
- **Weakness:** Slower; less suitable for tight feedback loops

### The Chain
In production these are often composed:
```
Advisor → shapes generation → Critic → refines → Evaluator → scores → Reviewer → approves
```

---

## 3. Implementation in Multi-Agent Systems

### Core Patterns

**1. Tool-Based Advisory (most common)**

The advisor is exposed as a callable tool. The worker or orchestrator calls it and blocks until a response:

```
Orchestrator
  |
  |── calls ──> Worker Agent ("write SQL query")
  |                |
  |                |── calls ──> advisor_tool("Is this query safe?")
  |                                   |
  |                              Advisor Agent
  |                              (returns guidance, not action)
  |                <── structured response ──
  |
  |── proceeds or halts based on advice
```

**2. Supervisor/Reviewer Pattern**

Orchestrator always routes outputs through advisor before committing. Advisor returns one of:
- `APPROVE` — proceed
- `REJECT` — halt, escalate
- `REVISE(instructions)` — loop back to worker

**3. On-Demand Consultation (pull model)**

Workers call the advisor themselves when they detect uncertainty. Advisor is in the worker's tool list. Not called on every step — only when confidence is low. Reduces latency vs. always-on supervision.

**4. Pre-flight Advisory**

Before execution begins, the full plan is passed to the advisor for review. Advisor returns critique or go/no-go. Only after approval does execution start.

### Pseudocode

```python
def orchestrator(task):
    plan = planner_agent.run(task)

    advice = advisor_agent.run({
        "task": task,
        "proposed_plan": plan,
        "question": "Is this plan safe and correct?"
    })

    if advice["decision"] == "APPROVE":
        return executor_agent.run(plan)
    elif advice["decision"] == "REVISE":
        revised_plan = planner_agent.run(task, feedback=advice["reasoning"])
        return executor_agent.run(revised_plan)
    else:  # REJECT
        raise EscalationError(advice["reasoning"])
```

### When to Call the Advisor

| Trigger | Pattern | Example |
|---------|---------|---------|
| Before any tool-use | Pre-execution gate | "Is it safe to call this API?" |
| After plan generation | Plan review | "Does this plan meet constraints?" |
| Worker is uncertain | On-demand pull | Worker detects low-confidence output |
| After worker output | Post-execution QA | "Is this SQL correct and safe?" |
| Worker fails after N retries | Escalation handler | Fall through to advisor |

### Communication Contracts

- **Structured output:** Advisors should return JSON with typed fields (`decision`, `reasoning`, `suggested_revision`) — not free text. Makes orchestrator logic deterministic.
- **Stateless per call:** Pass a full context bundle each time (task goal, prior steps, current proposal). Advisors that accumulate state develop bias.
- **Never direct-message workers:** All advisor communication flows through the orchestrator.

### Pitfalls

| Pitfall | Why it matters | Fix |
|---------|----------------|-----|
| Advisor with write access | Blurs worker/advisor boundary | Make advisor read-only |
| Infinite advisory loops | Advisor always returns REVISE | Hard cap at 3 loops; escalate to human |
| Over-consulting | Adds latency + cost on every micro-step | Reserve for high-stakes/ambiguous decisions |
| Stateful advisors | Accumulates bias, conflicting context | Stateless design, full context per call |
| Free-text advisor output | Orchestrator must parse natural language | Enforce a response schema |
| Single advisor bottleneck | Throughput bottleneck in high-volume systems | Async calls or advisor pool |

---

## 4. Implementation via MCP Server

The recommended path for exposing an advisor tool to Claude Code is an MCP server.

### How It Works

An advisor MCP tool is a regular MCP tool whose purpose is to return advisory text rather than perform an action. Claude Code reads the tool description and autonomously decides when to call it — so the description drives behavior.

### Configuration

Add the MCP server to `.claude/settings.json` (project-level) or `~/.claude/settings.json` (global):

**stdio transport (local script):**
```json
{
  "mcpServers": {
    "project-advisor": {
      "command": "node",
      "args": ["/path/to/advisor-server/index.js"],
      "env": {}
    }
  }
}
```

**SSE transport (remote server):**
```json
{
  "mcpServers": {
    "project-advisor": {
      "url": "http://localhost:3100/sse"
    }
  }
}
```

### Tool Descriptor

The `description` field is critical — write it as an instruction to Claude:

```json
{
  "name": "get_project_rules",
  "description": "Returns architectural rules and coding standards for this project. Always call this before writing new modules or modifying existing APIs.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic": {
        "type": "string",
        "description": "Optional topic to filter rules (e.g. 'auth', 'database')"
      }
    }
  }
}
```

Phrases like "call this before..." or "always consult this when..." directly influence Claude's behavior.

### Minimal stdio MCP Server (Node.js)

```js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({ name: "advisor", version: "1.0.0" }, {
  capabilities: { tools: {} }
});

server.setRequestHandler("tools/list", async () => ({
  tools: [{
    name: "get_project_rules",
    description: "Returns architectural rules and coding standards. Always call this before writing new modules or modifying existing APIs.",
    inputSchema: { type: "object", properties: {} }
  }]
}));

server.setRequestHandler("tools/call", async (req) => {
  if (req.params.name === "get_project_rules") {
    return {
      content: [{
        type: "text",
        text: "1. Never expose raw DB models in API responses.\n2. All auth must go through the auth middleware.\n3. Use Zod for all input validation."
      }]
    };
  }
  throw new Error("Unknown tool");
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### MCP vs CLAUDE.md for Rules

| Use case | Recommendation |
|----------|---------------|
| Static project rules | `CLAUDE.md` — simpler, no infrastructure |
| Dynamic rules (environment-dependent) | MCP advisor server |
| Rules from external source (team knowledge base, DB) | MCP advisor server |
| Rules that need topic filtering | MCP advisor with `topic` param |

---

## 5. Implementation via Claude Code Hooks

Hooks let external scripts intercept Claude's tool calls. This is an alternative (more opaque) advisor implementation.

### Relevant Hook Types

| Hook | When it fires | Advisor use |
|------|--------------|-------------|
| `PreToolUse` | Before Claude executes any tool | Intercept, inspect, block, or modify |
| `PostToolUse` | After a tool call completes | Inspect output, log, append warnings |
| `Stop` | When Claude finishes a turn | Post-turn audit |

`PreToolUse` is the primary hook for advisor behavior.

### Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/advisor-script.sh"
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
            "command": "/path/to/post-advisor.sh"
          }
        ]
      }
    ]
  }
}
```

- `matcher` accepts a tool name (`"Bash"`, `"Edit"`, `"Write"`) or `"*"` for all tools
- Multiple hooks per event run in order

### Hook Input (via stdin)

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /tmp/foo"
  }
}
```

### Exit Code Behavior

| Exit code | Effect |
|-----------|--------|
| `0` | Allow the tool call to proceed |
| Non-zero | Block the tool call; stdout is returned to Claude as the error reason |

### Example: Blocking Advisor (PreToolUse)

```bash
#!/usr/bin/env bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Flag dangerous patterns
if echo "$COMMAND" | grep -qE 'rm -rf|DROP TABLE|git push --force'; then
  echo "ADVISORY: This command matches a dangerous pattern. Explain your intent before proceeding."
  exit 1  # Block and return message to Claude
fi

exit 0  # Allow
```

### Example: Non-blocking Audit (PostToolUse)

```bash
#!/usr/bin/env bash
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
echo "Audit log: $TOOL used at $(date)" >> /tmp/claude-audit.log
exit 0
```

### Example: Scope Guard (PreToolUse on Edit/Write)

```bash
#!/usr/bin/env bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
PROJECT_ROOT="/root/code/heatsheet"

if [[ "$FILE" != "$PROJECT_ROOT"* ]]; then
  echo "ADVISORY: File path is outside the project root. Confirm before proceeding."
  exit 1
fi

exit 0
```

---

## 6. Comparison: MCP vs Hooks vs Native Agent

| Dimension | Hook-based advisor | MCP advisor tool | Native agent (subagent) |
|-----------|-------------------|-----------------|------------------------|
| **Latency** | Subprocess overhead per call | Minimal (in-process) | Full LLM inference |
| **Language** | Any executable | Node/Python/any (MCP server) | Claude itself |
| **Context access** | Only current tool call JSON | Can receive full context as input | Full conversation context |
| **Bidirectional** | Block + return message only | Return structured advice | Can trigger follow-up actions |
| **State** | Stateless (unless uses file/db) | Can maintain session state | Full stateful reasoning |
| **Visible to Claude** | No — opaque | Yes — in tool list, Claude reasons about it | Yes — full agent |
| **Composability** | Cannot chain in one round-trip | Can compose in a pipeline | Fully composable |
| **Best for** | Guardrails, security gates | Domain rules, dynamic context | Complex advisory requiring reasoning |

### Decision Guide

```
Need to block dangerous actions?          → Hooks (PreToolUse)
Need dynamic rules from external source?  → MCP advisor
Need Claude to reason about the advice?   → MCP advisor (visible) or subagent
Need stateful advisory reasoning?         → Native subagent (orchestrator/advisor role)
Need simple static rules?                 → CLAUDE.md
```

---

## 7. Framework Support

### LangGraph
Advisor implemented as a node in the graph with conditional edges:
```python
# Advisor node returns modified state
graph.add_node("advisor", advisor_node)
graph.add_conditional_edges("advisor", should_continue_or_revise)
```

### AutoGen
Advisor is a `ConversableAgent` with `human_input_mode="NEVER"` and a system prompt constraining it to critique-only. Registered in a `GroupChat` with `SpeakAfter` rules to control when it speaks.

### CrewAI
Advisor modeled as an Agent with `allow_delegation=False` and a review-focused role/goal. Orchestrator crew manually routes output to it before committing actions.

### Claude (Anthropic)
Advisor exposed as a tool on the parent/orchestrator agent. Child agent calls `consult_advisor` tool; parent agent (acting as advisor) responds inline. This is the native multi-agent pattern from Anthropic's documentation.

---

## 8. Best Practices

### Design
- **Stateless per call** — pass full context every time; don't let the advisor accumulate history
- **Structured responses** — always return JSON with typed fields (`decision`, `reasoning`, `suggestion`); never free text
- **Read-only** — advisors must never have write access or action tools
- **Scoped invocation** — don't call the advisor on every micro-step; reserve for high-stakes or ambiguous decisions

### MCP-specific
- **Description-driven invocation** — write tool descriptions as instructions ("Always call this before..."); this is how Claude decides to invoke the tool
- **Topic parameters** — accept an optional topic/scope filter so Claude can query only relevant rules
- **Dynamic content** — read from files, DBs, or APIs; advisory content need not be hardcoded

### Hook-specific
- **Minimal logic** — keep hook scripts fast; they run on every matching tool call
- **Structured stdin parsing** — always use `jq` or equivalent; never regex-parse JSON
- **Exit code discipline** — only exit non-zero when you genuinely want to block; false positives create frustrating loops

### Reliability
- **Hard retry cap** — if advisor returns REVISE, cap loops at 3 then escalate to human or fail hard
- **Async for throughput** — in high-volume systems, make advisor calls async or use an advisor pool
- **Test the advisor independently** — the advisor is a separate agent with its own system prompt; test it with adversarial inputs

---

## Sources & Verification

This research was synthesized from training knowledge (cutoff August 2025) across 9 parallel agents. Web search was unavailable in this session. Verify current state against:

- Anthropic Claude Code docs: `https://docs.anthropic.com/en/docs/claude-code/`
- Claude Code hooks: `https://docs.anthropic.com/en/docs/claude-code/hooks`
- MCP specification: `https://modelcontextprotocol.io/docs/concepts/tools`
- MCP TypeScript SDK: `https://github.com/modelcontextprotocol/typescript-sdk`
- Claude multi-agent patterns: `https://docs.anthropic.com/en/docs/build-with-claude/agents`
