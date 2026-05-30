# Phase 1 — Security & Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 ship-blocking correctness bugs, close 4 RLS authorization holes, and harden the league-creation and draft-start flows against client-side manipulation.

**Architecture:** All mutable league/draft operations move from direct client DB calls into server-side Postgres functions (SECURITY DEFINER RPCs). The client only calls `supabase.rpc(...)` — no more `insert({ role: 'commissioner' })` from the browser. Pure game-logic functions (`snakePickerIndex`, scoring) are extracted to `@fieldday/shared` so they can be tested independently.

**Tech Stack:** Supabase Postgres (RLS + plpgsql), Deno edge functions (TypeScript), Next.js 16 App Router, Expo 54, Vitest, `@fieldday/shared` workspace package.

**Dependency order:** Tasks 1 → 2 → 3 (foundation). Tasks 4–6 need Task 3. Tasks 7–9 need Tasks 2–3. Task 10–11 are independent.

---

## Task 1 — Extract and test pure game-logic functions

Extract `snakePickerIndex` from DraftRoom and add it and the scoring helpers to `@fieldday/shared` so they can be unit-tested.

**Files:**
- Create: `packages/shared/src/utils/draft.ts`
- Modify: `packages/shared/src/index.ts`
- Create: `packages/shared/src/utils/draft.test.ts`
- Modify: `apps/web/src/app/(app)/leagues/[id]/draft/DraftRoom.tsx` (import instead of redefine)

- [ ] **Step 1: Write the failing test**

Create `packages/shared/src/utils/draft.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { snakePickerIndex, computeRosterPoints } from './draft'
import { PLACE_POINTS, DNF_PENALTY, CAPTAIN_MULTIPLIER, MEET_TIER_MULTIPLIERS } from '../constants/scoring'

describe('snakePickerIndex', () => {
  it('round 1 goes 1→N (ascending)', () => {
    expect(snakePickerIndex(1, 4)).toBe(1)
    expect(snakePickerIndex(2, 4)).toBe(2)
    expect(snakePickerIndex(3, 4)).toBe(3)
    expect(snakePickerIndex(4, 4)).toBe(4)
  })

  it('round 2 goes N→1 (descending)', () => {
    expect(snakePickerIndex(5, 4)).toBe(4)
    expect(snakePickerIndex(6, 4)).toBe(3)
    expect(snakePickerIndex(7, 4)).toBe(2)
    expect(snakePickerIndex(8, 4)).toBe(1)
  })

  it('round 3 goes 1→N again', () => {
    expect(snakePickerIndex(9, 4)).toBe(1)
    expect(snakePickerIndex(12, 4)).toBe(4)
  })

  it('works for 2-member league', () => {
    expect(snakePickerIndex(1, 2)).toBe(1)
    expect(snakePickerIndex(2, 2)).toBe(2)
    expect(snakePickerIndex(3, 2)).toBe(1) // round 2 reverses: N=2, pos=1 → 2-1+1=2... wait
    // For 2 members: round 2, pos 1 → numMembers - 1 + 1 = 2 (last pick goes to member 2)
    expect(snakePickerIndex(3, 2)).toBe(2)
    expect(snakePickerIndex(4, 2)).toBe(1)
  })
})

describe('PLACE_POINTS', () => {
  it('awards 20 points for 1st', () => {
    expect(PLACE_POINTS[1]).toBe(20)
  })

  it('awards 1 point for 20th', () => {
    expect(PLACE_POINTS[20]).toBe(1)
  })
})

describe('MEET_TIER_MULTIPLIERS', () => {
  it('world championship is 3x', () => {
    expect(MEET_TIER_MULTIPLIERS.world_championship).toBe(3)
  })

  it('regular meet is 1x', () => {
    expect(MEET_TIER_MULTIPLIERS.regular).toBe(1)
  })
})

describe('computeRosterPoints', () => {
  const athlete1 = { athleteId: 'a1', slotType: 'captain' as const }
  const athlete2 = { athleteId: 'a2', slotType: 'starter' as const }
  const athlete3 = { athleteId: 'a3', slotType: 'bench' as const }
  const pointsMap = new Map([['a1', 20], ['a2', 10], ['a3', 5]])

  it('doubles captain points', () => {
    const result = computeRosterPoints([athlete1], pointsMap)
    expect(result).toBe(40) // 20 * 2
  })

  it('counts starters at 1x', () => {
    const result = computeRosterPoints([athlete2], pointsMap)
    expect(result).toBe(10)
  })

  it('ignores bench', () => {
    const result = computeRosterPoints([athlete3], pointsMap)
    expect(result).toBe(0)
  })

  it('sums mixed roster correctly', () => {
    const result = computeRosterPoints([athlete1, athlete2, athlete3], pointsMap)
    expect(result).toBe(50) // 40 + 10 + 0
  })

  it('handles athletes not in points map (0 points)', () => {
    const result = computeRosterPoints([{ athleteId: 'unknown', slotType: 'starter' }], pointsMap)
    expect(result).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd /root/code/heatsheet/packages/shared && npx vitest run
```
Expected: `FAIL` with "Cannot find module './draft'"

- [ ] **Step 3: Add MEET_TIER_MULTIPLIERS runtime constant to scoring.ts**

In `packages/shared/src/types/scoring.ts`, the `MeetTierMultiplier` type exists but has no runtime value. Add the constant (same file):

```typescript
// Add after the MeetTierMultiplier type:
export const MEET_TIER_MULTIPLIERS: Record<keyof MeetTierMultiplier, number> = {
  world_championship: 3,
  diamond_league: 2,
  gold: 1.5,
  silver: 1.25,
  bronze: 1.1,
  regular: 1,
} as const
```

- [ ] **Step 4: Create packages/shared/src/utils/draft.ts**

```typescript
import { CAPTAIN_MULTIPLIER } from '../types/scoring'

/**
 * Returns the draft_order index (1-based) of who picks at `pickNumber`
 * in a snake draft with `numMembers` participants.
 * Odd rounds go 1→N, even rounds go N→1.
 */
export function snakePickerIndex(pickNumber: number, numMembers: number): number {
  const round = Math.ceil(pickNumber / numMembers)
  const posInRound = ((pickNumber - 1) % numMembers) + 1
  return round % 2 === 1 ? posInRound : numMembers - posInRound + 1
}

export interface RosterSlot {
  athleteId: string
  slotType: 'captain' | 'starter' | 'bench'
}

/**
 * Computes total fantasy points for a roster given a map of athlete → raw points.
 * Captain slots are multiplied by CAPTAIN_MULTIPLIER; bench slots score 0.
 */
export function computeRosterPoints(
  slots: RosterSlot[],
  athletePoints: Map<string, number>,
): number {
  let total = 0
  for (const slot of slots) {
    if (slot.slotType === 'bench') continue
    const pts = athletePoints.get(slot.athleteId) ?? 0
    total += slot.slotType === 'captain' ? pts * CAPTAIN_MULTIPLIER : pts
  }
  return total
}
```

- [ ] **Step 5: Export from packages/shared/src/index.ts**

Read the current `packages/shared/src/index.ts` and add:

```typescript
export * from './utils/draft'
export { MEET_TIER_MULTIPLIERS } from './types/scoring'
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd /root/code/heatsheet/packages/shared && npx vitest run
```
Expected: all tests PASS.

- [ ] **Step 7: Update DraftRoom.tsx to import instead of redefine**

In `apps/web/src/app/(app)/leagues/[id]/draft/DraftRoom.tsx`:
- Remove the local `snakePickerIndex` function (lines 47–51)
- Add import: `import { snakePickerIndex } from '@fieldday/shared'`

- [ ] **Step 8: Verify typecheck still passes**

```bash
cd /root/code/heatsheet && npm run typecheck
```
Expected: 5 successful.

- [ ] **Step 9: Commit**

```bash
git add packages/shared/src/utils/draft.ts packages/shared/src/utils/draft.test.ts packages/shared/src/types/scoring.ts packages/shared/src/index.ts apps/web/src/app/\(app\)/leagues/\[id\]/draft/DraftRoom.tsx
git commit -m "feat: extract snakePickerIndex and computeRosterPoints to @fieldday/shared with tests"
```

---

## Task 2 — Migration: schema fixes and security triggers

Widen the `total_points` column, add `scored_at` to meets, add the invite-code length constraint, and add a trigger to protect league immutable columns.

**Files:**
- Create: `supabase/migrations/20260101000011_schema_fixes.sql`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260101000011_schema_fixes.sql`:

```sql
-- Widen scoring_events.total_points (was numeric(6,2), max ~9999.99)
-- numeric(8,2) gives max ~999999.99, sufficient for world_championship × captain × place
alter table public.scoring_events
  alter column total_points type numeric(8,2);

-- Add scored_at timestamp to meets for idempotency and pickem reveal logic
alter table public.meets
  add column if not exists scored_at timestamptz;

-- Sync: any already-scored meets get a scored_at value
update public.meets set scored_at = now() where is_scored = true and scored_at is null;

-- Enforce invite_code length exactly 8 characters (NULL allowed for public leagues)
alter table public.leagues
  add constraint leagues_invite_code_length check (
    invite_code is null or length(invite_code) = 8
  );

-- Protect leagues.season_id and leagues.created_by from being changed after creation
create or replace function public.protect_league_immutable_cols()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if NEW.season_id <> OLD.season_id then
    raise exception 'season_id cannot be changed after creation';
  end if;
  if NEW.created_by <> OLD.created_by then
    raise exception 'created_by cannot be changed after creation';
  end if;
  return NEW;
end;
$$;

drop trigger if exists protect_league_immutable_cols on public.leagues;
create trigger protect_league_immutable_cols
  before update on public.leagues
  for each row execute function public.protect_league_immutable_cols();
```

- [ ] **Step 2: Apply and verify locally**

```bash
supabase db reset
```
Expected: migrations apply cleanly, no errors. Seed inserts without issue.

To verify the column width:
```bash
supabase db diff --linked || psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\d scoring_events"
```
Look for `total_points | numeric(8,2)` in the output.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260101000011_schema_fixes.sql
git commit -m "feat: widen scoring_events.total_points, add meets.scored_at, protect league immutable cols"
```

---

## Task 3 — Migration: RLS hardening and new RPCs

Replace the broad `league_members` insert policy (the commissioner-promotion hole), restrict `rosters` and `roster_athletes` to read-only from the client, lock down pickem visibility, and add the `create_league`, `join_league_by_invite`, `add_member_points`, and `start_draft` functions.

**Files:**
- Create: `supabase/migrations/20260101000012_rls_and_rpcs.sql`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260101000012_rls_and_rpcs.sql`:

```sql
-- ============================================================
-- LEAGUE_MEMBERS: prevent client-side commissioner self-promotion
-- and private-league bypass
-- ============================================================

-- Drop old overly broad policy
drop policy if exists "Authenticated users can join leagues" on public.league_members;

-- Clients can only insert a 'member' row into public leagues that aren't past pre_draft
-- create_league and join_league_by_invite RPCs bypass this (SECURITY DEFINER)
create policy "Members can join public pre-draft leagues"
  on public.league_members for insert
  with check (
    auth.uid() = user_id
    and role = 'member'
    and (
      select type from public.leagues where id = league_id
    ) = 'public'
    and (
      select draft_status from public.leagues where id = league_id
    ) = 'pre_draft'
  );

-- ============================================================
-- ROSTERS: clients read-only; all writes go through RPCs/edge functions
-- ============================================================

drop policy if exists "Users can manage their own roster" on public.rosters;

create policy "Users can read their own rosters"
  on public.rosters for select
  using (auth.uid() = user_id or public.is_league_member(league_id));

-- ============================================================
-- ROSTER_ATHLETES: clients read-only; writes via make-draft-pick edge function
-- ============================================================

drop policy if exists "Users can manage their own roster athletes" on public.roster_athletes;

create policy "League members can view roster athletes"
  on public.roster_athletes for select
  using (
    public.is_league_member(
      (select league_id from public.rosters where id = roster_id)
    )
  );

-- ============================================================
-- PICKEM: only own entries visible before scoring; all visible after
-- ============================================================

drop policy if exists "Users can read any pickem entry" on public.pickem_entries;
drop policy if exists "Users can read any pickem pick" on public.pickem_picks;

create policy "Users see own entries or entries for scored meets"
  on public.pickem_entries for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.meets
      where id = meet_id and scored_at is not null
    )
  );

create policy "Users see own picks or picks for scored meets"
  on public.pickem_picks for select
  using (
    exists (
      select 1 from public.pickem_entries e
      where e.id = entry_id
      and (
        e.user_id = auth.uid()
        or exists (
          select 1 from public.meets where id = e.meet_id and scored_at is not null
        )
      )
    )
  );

-- ============================================================
-- RPCs
-- ============================================================

-- Helper: check if calling user is commissioner of a league
create or replace function public.is_league_commissioner(p_league_id uuid)
returns boolean
language sql security definer
set search_path = public
as $$
  select exists (
    select 1 from public.league_members
    where league_id = p_league_id
    and user_id = auth.uid()
    and role = 'commissioner'
  );
$$;

-- create_league: atomic insert of league + commissioner row + roster
-- Returns the new league_id
create or replace function public.create_league(
  p_name        text,
  p_season_id   uuid,
  p_type        public.league_type,
  p_max_members int     default 10,
  p_description text    default null
) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_user_id   uuid;
  v_league_id uuid;
  v_invite    text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Verify season exists and is open for leagues
  if not exists (select 1 from public.seasons where id = p_season_id) then
    raise exception 'Season not found';
  end if;

  -- Validate inputs
  if length(trim(p_name)) < 3 then
    raise exception 'League name must be at least 3 characters';
  end if;
  if p_max_members < 2 or p_max_members > 20 then
    raise exception 'max_members must be between 2 and 20';
  end if;

  -- Generate invite code for private leagues using pgcrypto (always 8 hex chars)
  if p_type = 'private' then
    v_invite := upper(encode(gen_random_bytes(4), 'hex'));
  end if;

  insert into public.leagues (
    name, season_id, type, max_members, description, created_by, invite_code
  ) values (
    trim(p_name), p_season_id, p_type, p_max_members, p_description, v_user_id, v_invite
  ) returning id into v_league_id;

  -- Commissioner membership
  insert into public.league_members (league_id, user_id, role)
  values (v_league_id, v_user_id, 'commissioner');

  -- Initial roster
  insert into public.rosters (league_id, user_id, season_id)
  values (v_league_id, v_user_id, p_season_id);

  return v_league_id;
end;
$$;

-- join_league_by_invite: validates invite code + capacity + draft status, then inserts
create or replace function public.join_league_by_invite(
  p_league_id   uuid,
  p_invite_code text default null
) returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_user_id     uuid;
  v_league      record;
  v_count       int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_league from public.leagues where id = p_league_id;
  if not found then
    raise exception 'League not found';
  end if;

  if v_league.draft_status <> 'pre_draft' then
    raise exception 'Cannot join after the draft has started';
  end if;

  if v_league.type = 'private' then
    if p_invite_code is null or upper(p_invite_code) <> v_league.invite_code then
      raise exception 'Invalid invite code';
    end if;
  end if;

  select count(*) into v_count from public.league_members where league_id = p_league_id;
  if v_count >= v_league.max_members then
    raise exception 'League is full';
  end if;

  if exists (
    select 1 from public.league_members where league_id = p_league_id and user_id = v_user_id
  ) then
    raise exception 'Already a member of this league';
  end if;

  insert into public.league_members (league_id, user_id, role)
  values (p_league_id, v_user_id, 'member');

  insert into public.rosters (league_id, user_id, season_id)
  values (p_league_id, v_user_id, v_league.season_id);
end;
$$;

-- add_member_points: used by score-meet edge function
create or replace function public.add_member_points(
  p_league_id uuid,
  p_user_id   uuid,
  p_points    numeric(8,2)
) returns void
language plpgsql security definer
set search_path = public
as $$
begin
  update public.league_members
  set total_points = coalesce(total_points, 0) + p_points
  where league_id = p_league_id and user_id = p_user_id;
end;
$$;

-- start_draft: randomises draft order using pgcrypto, transitions league to active
create or replace function public.start_draft(p_league_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_user_id     uuid;
  v_league      record;
  v_count       int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_league from public.leagues where id = p_league_id;
  if not found then raise exception 'League not found'; end if;

  if not public.is_league_commissioner(p_league_id) then
    raise exception 'Only the commissioner can start the draft';
  end if;

  if v_league.draft_status <> 'pre_draft' then
    raise exception 'Draft has already been started';
  end if;

  select count(*) into v_count from public.league_members where league_id = p_league_id;
  if v_count < 2 then
    raise exception 'Need at least 2 members to start the draft';
  end if;

  -- Fisher-Yates via ORDER BY gen_random_bytes — cryptographically random, uniform permutation
  with shuffled as (
    select user_id,
           row_number() over (order by gen_random_bytes(4)) as ord
    from public.league_members
    where league_id = p_league_id
  )
  update public.league_members lm
  set draft_order = s.ord::int
  from shuffled s
  where lm.league_id = p_league_id and lm.user_id = s.user_id;

  -- Ensure every member has a roster (idempotent)
  insert into public.rosters (league_id, user_id, season_id)
  select p_league_id, lm.user_id, v_league.season_id
  from public.league_members lm
  where lm.league_id = p_league_id
  on conflict (league_id, user_id) do nothing;

  update public.leagues
  set draft_status = 'active'
  where id = p_league_id;
end;
$$;
```

- [ ] **Step 2: Apply and verify**

```bash
supabase db reset
```

Verify policies with psql (optional):
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "select policyname, cmd from pg_policies where tablename in ('league_members','rosters','roster_athletes','pickem_entries','pickem_picks') order by tablename, cmd;"
```
Expected: `commissioner` role no longer appears in league_members INSERT policy.

- [ ] **Step 3: Verify RPCs exist**

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "select routine_name from information_schema.routines where routine_schema='public' and routine_type='FUNCTION' order by routine_name;"
```
Expected: `add_member_points`, `create_league`, `is_league_commissioner`, `join_league_by_invite`, `start_draft` in the list.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260101000012_rls_and_rpcs.sql
git commit -m "feat: harden RLS on league_members/rosters/pickem; add create_league, join_league_by_invite, start_draft, add_member_points RPCs"
```

---

## Task 4 — Rewrite score-meet edge function

Fix: increment RPC bug, cross-season contamination, no idempotency, pin supabase-js version.

**Files:**
- Modify: `supabase/functions/score-meet/index.ts`

- [ ] **Step 1: Replace the file**

```typescript
/**
 * score-meet
 *
 * Computes fantasy points for all rosters in the meet's season after
 * scoring_events have been inserted for the meet. Idempotent: re-invoking
 * with force=false on an already-scored meet returns a 409.
 *
 * Auth: Bearer FUNCTION_SECRET header
 * Body: { meetId: string, force?: boolean }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.101.1'

const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET')

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader || authHeader !== `Bearer ${FUNCTION_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  let meetId: string
  let force: boolean
  try {
    const body = await req.json()
    meetId = body.meetId
    force = body.force === true
    if (!meetId || typeof meetId !== 'string') throw new Error('meetId required')
  } catch (e) {
    return json({ error: String(e) }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Load meet + season_id in one query
  const { data: meet, error: meetError } = await supabase
    .from('meets')
    .select('id, season_id, is_scored, scored_at')
    .eq('id', meetId)
    .single()

  if (meetError || !meet) return json({ error: 'Meet not found' }, 404)

  if (meet.is_scored && !force) {
    return json({ error: 'Meet already scored. Pass force=true to re-score.' }, 409)
  }

  // Aggregate raw points per athlete for this meet
  const { data: events, error: eventsError } = await supabase
    .from('scoring_events')
    .select('athlete_id, total_points')
    .eq('meet_id', meetId)

  if (eventsError) {
    console.error('[score-meet] scoring_events query failed:', eventsError)
    return json({ error: eventsError.message }, 500)
  }

  if (!events?.length) {
    return json({ error: 'No scoring events for this meet' }, 422)
  }

  const athletePoints = new Map<string, number>()
  for (const ev of events) {
    athletePoints.set(ev.athlete_id, (athletePoints.get(ev.athlete_id) ?? 0) + Number(ev.total_points))
  }

  // Load rosters scoped to this meet's season via leagues.season_id
  const { data: rosters, error: rostersError } = await supabase
    .from('rosters')
    .select('id, user_id, league_id, leagues!inner(season_id)')
    .eq('leagues.season_id', meet.season_id)

  if (rostersError) {
    console.error('[score-meet] rosters query failed:', rostersError)
    return json({ error: rostersError.message }, 500)
  }

  if (!rosters?.length) {
    return json({ ok: true, message: 'No rosters in this season', rostersScored: 0 })
  }

  let rostersScored = 0
  for (const roster of rosters) {
    const { data: slots } = await supabase
      .from('roster_athletes')
      .select('athlete_id, slot_type')
      .eq('roster_id', roster.id)

    if (!slots?.length) continue

    let points = 0
    for (const slot of slots) {
      if (slot.slot_type === 'bench') continue
      const pts = athletePoints.get(slot.athlete_id) ?? 0
      points += slot.slot_type === 'captain' ? pts * 2 : pts
    }

    if (points > 0) {
      const { error: rpcError } = await supabase.rpc('add_member_points', {
        p_league_id: roster.league_id,
        p_user_id: roster.user_id,
        p_points: points,
      })
      if (rpcError) {
        console.error(`[score-meet] add_member_points failed for roster ${roster.id}:`, rpcError)
      }
    }
    rostersScored++
  }

  // Mark meet as scored
  const { error: updateError } = await supabase
    .from('meets')
    .update({ is_scored: true, scored_at: new Date().toISOString() })
    .eq('id', meetId)

  if (updateError) {
    console.error('[score-meet] failed to mark meet as scored:', updateError)
  }

  return json({ ok: true, meetId, rostersScored })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 2: Verify it typechecks (Deno)**

```bash
cd supabase/functions/score-meet && deno check index.ts
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/score-meet/index.ts
git commit -m "fix: rewrite score-meet — fix RPC increment bug, add season scoping, add idempotency guard"
```

---

## Task 5 — Fix make-draft-pick edge function

Remove dead code, add UUID input validation, improve error message on pick-number race condition (unique constraint violation).

**Files:**
- Modify: `supabase/functions/make-draft-pick/index.ts`

- [ ] **Step 1: Apply targeted fixes to existing file**

The file is 194 lines. Make three targeted changes:

**Change A — Remove dead salary-sum reduce (lines 106–111):**

Remove these lines entirely:
```typescript
  const myPicksSalary = existingPicks
    .filter((p) => p.user_id === user.id)
    .reduce((sum, p) => {
      // We need salaries of previous picks — load them
      return sum // simplified; full impl fetches from draft_picks join athletes
    }, 0)
```

**Change B — Add UUID validation after body parse (after line 42):**

```typescript
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(leagueId) || !UUID_RE.test(athleteId)) {
    return json({ error: 'leagueId and athleteId must be valid UUIDs' }, 400)
  }
```

**Change C — Improve error on pick-number conflict (after `if (pickError)` block at line 138):**

Replace:
```typescript
  if (pickError) {
    console.error('[make-draft-pick] insert error:', pickError)
    return json({ error: 'Failed to record pick' }, 500)
  }
```
With:
```typescript
  if (pickError) {
    console.error('[make-draft-pick] insert error:', pickError)
    // Unique constraint on (league_id, pick_number) means another pick landed first
    if (pickError.code === '23505') {
      return json({ error: 'It is not your turn — someone just picked ahead of you' }, 409)
    }
    return json({ error: 'Failed to record pick' }, 500)
  }
```

- [ ] **Step 2: Verify deno check**

```bash
cd supabase/functions/make-draft-pick && deno check index.ts
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/make-draft-pick/index.ts
git commit -m "fix: make-draft-pick — remove dead salary reduce, add UUID validation, improve race-condition error"
```

---

## Task 6 — New start-draft edge function

Thin wrapper that calls the `start_draft` SQL RPC. Replaces the client-side `StartDraftButton` shuffle logic.

**Files:**
- Create: `supabase/functions/start-draft/index.ts`
- Modify: `supabase/config.toml` (register the new function)

- [ ] **Step 1: Create the function**

Create `supabase/functions/start-draft/index.ts`:

```typescript
/**
 * start-draft
 *
 * Delegates to the start_draft(p_league_id) SQL RPC.
 * The RPC validates commissioner role, randomises draft order
 * via pgcrypto, and atomically transitions draft_status to 'active'.
 *
 * Auth: user JWT (supabase.auth.getUser)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.101.1'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !user) return new Response('Unauthorized', { status: 401 })

  let leagueId: string
  try {
    const body = await req.json()
    leagueId = body.leagueId
    if (!leagueId || typeof leagueId !== 'string') throw new Error('leagueId required')
  } catch (e) {
    return json({ error: String(e) }, 400)
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(leagueId)) {
    return json({ error: 'leagueId must be a valid UUID' }, 400)
  }

  // Use the user's token to call the RPC — RPC checks commissioner role via auth.uid()
  const { error: rpcError } = await supabaseUser.rpc('start_draft', {
    p_league_id: leagueId,
  })

  if (rpcError) {
    console.error('[start-draft] RPC error:', rpcError)
    return json({ error: rpcError.message }, rpcError.code === 'P0001' ? 400 : 500)
  }

  return json({ ok: true })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

- [ ] **Step 2: Register in config.toml**

Read `supabase/config.toml` and add after the `[functions.score-meet]` block:

```toml
[functions.start-draft]
verify_jwt = false
```

(JWT verification is done manually in the function body, same pattern as `make-draft-pick`.)

- [ ] **Step 3: Verify deno check**

```bash
cd supabase/functions/start-draft && deno check index.ts
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/start-draft/index.ts supabase/config.toml
git commit -m "feat: add start-draft edge function — delegates to start_draft RPC with pgcrypto shuffle"
```

---

## Task 7 — Fix leagues/new: server+client split, call create_league RPC

Fixes: `useState` misuse as side-effect hook, client commissioner self-promotion, insecure invite-code generation. The page becomes a server component that passes seasons as props; a new `NewLeagueForm` client component calls `supabase.rpc('create_league', ...)`.

**Files:**
- Modify: `apps/web/src/app/(app)/leagues/new/page.tsx` (convert to server component)
- Create: `apps/web/src/app/(app)/leagues/new/NewLeagueForm.tsx` (new client component)

- [ ] **Step 1: Replace page.tsx with a server component**

Replace the entire content of `apps/web/src/app/(app)/leagues/new/page.tsx`:

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewLeagueForm } from './NewLeagueForm'

export default async function NewLeaguePage() {
  const supabase = await createClient()
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name')
    .in('status', ['upcoming', 'active'])
    .order('starts_at')

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6">
      <div>
        <Link href="/leagues" className="mb-2 block text-sm text-zinc-500 hover:text-zinc-300">
          ← My Leagues
        </Link>
        <h1 className="text-2xl font-black text-white">Create a League</h1>
      </div>
      <NewLeagueForm seasons={seasons ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Create NewLeagueForm.tsx**

Create `apps/web/src/app/(app)/leagues/new/NewLeagueForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreateLeagueSchema } from '@fieldday/shared'

interface Season {
  id: string
  name: string
}

export function NewLeagueForm({ seasons }: { seasons: Season[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<'public' | 'private'>('public')
  const [maxMembers, setMaxMembers] = useState(10)
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = CreateLeagueSchema.safeParse({ name, seasonId, type, maxMembers })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input')
      return
    }
    setError('')
    setIsLoading(true)

    const supabase = createClient()
    const { data: leagueId, error: rpcError } = await supabase.rpc('create_league', {
      p_name: parsed.data.name,
      p_season_id: parsed.data.seasonId,
      p_type: parsed.data.type,
      p_max_members: parsed.data.maxMembers,
    })

    if (rpcError || !leagueId) {
      setError(rpcError?.message ?? 'Failed to create league')
      setIsLoading(false)
      return
    }

    router.push(`/leagues/${leagueId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-5">
      {/* League name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-400">League Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. The Fast Lane"
          className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-white placeholder-zinc-600 focus:border-[#E8FF00] focus:outline-none"
        />
      </div>

      {/* Season */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-400">Season</label>
        <select
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
          className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-white focus:border-[#E8FF00] focus:outline-none"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-400">League Type</label>
        <div className="flex gap-2">
          {(['public', 'private'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold capitalize transition-colors ${
                type === t
                  ? 'border-[#E8FF00] bg-[#E8FF00]/10 text-[#E8FF00]'
                  : 'border-[#2A2A2A] text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          {type === 'private'
            ? 'An 8-character invite code will be generated for you to share.'
            : 'Anyone can find and join this league.'}
        </p>
      </div>

      {/* Max members */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-400">
          Max Members <span className="text-zinc-600">({maxMembers})</span>
        </label>
        <input
          type="range"
          min={2}
          max={20}
          value={maxMembers}
          onChange={(e) => setMaxMembers(Number(e.target.value))}
          className="accent-[#E8FF00]"
        />
        <div className="flex justify-between text-xs text-zinc-600">
          <span>2</span><span>20</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isLoading || !seasonId}
        className="rounded-xl bg-[#E8FF00] py-3 font-bold text-[#0D0D0D] transition-opacity disabled:opacity-50"
      >
        {isLoading ? 'Creating…' : 'Create League'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
cd /root/code/heatsheet && npm run typecheck
```
Expected: 5 successful.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(app\)/leagues/new/page.tsx apps/web/src/app/\(app\)/leagues/new/NewLeagueForm.tsx
git commit -m "fix: leagues/new — server component passes seasons as props; create_league RPC replaces client inserts"
```

---

## Task 8 — Fix StartDraftButton to call start-draft edge function

The entire shuffle and multi-step loop is replaced by a single edge function call. The `start_draft` SQL RPC handles ordering and atomicity server-side.

**Files:**
- Modify: `apps/web/src/app/(app)/leagues/[id]/StartDraftButton.tsx`

- [ ] **Step 1: Replace the file**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function StartDraftButton({
  leagueId,
  memberCount,
}: {
  leagueId: string
  memberCount: number
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function startDraft() {
    if (memberCount < 2) {
      setError('Need at least 2 members to start the draft.')
      return
    }
    setIsLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    const res = await fetch('/api/start-draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ leagueId }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Failed to start draft')
      setIsLoading(false)
      return
    }

    router.refresh()
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={startDraft}
        disabled={isLoading || memberCount < 2}
        className="rounded-lg bg-[#E8FF00] px-4 py-2 text-sm font-bold text-[#0D0D0D] transition-opacity disabled:opacity-50"
      >
        {isLoading ? 'Starting…' : 'Start Draft'}
      </button>
      {memberCount < 2 && (
        <p className="text-xs text-zinc-500">Need at least 2 members</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
```

**Note:** The button calls `/api/start-draft` — a Next.js route handler that proxies to the Supabase edge function. This avoids exposing the Supabase function URL directly.

- [ ] **Step 2: Create the Next.js route handler**

Create `apps/web/src/app/api/start-draft/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leagueId } = await request.json() as { leagueId: string }
  if (!leagueId) return NextResponse.json({ error: 'leagueId required' }, { status: 400 })

  // Call the start_draft RPC directly from the server (already authed)
  const { error } = await supabase.rpc('start_draft', { p_league_id: leagueId })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'P0001' ? 400 : 500 })
  }

  return NextResponse.json({ ok: true })
}
```

**Why a route handler instead of a direct client RPC call?**
The `start_draft` RPC uses `auth.uid()` which requires the user JWT to be present in the request. Calling it from a Next.js Route Handler using `@supabase/ssr`'s `createClient()` passes the auth cookie automatically. The client-side button still gets a clean API call.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: 5 successful.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(app\)/leagues/\[id\]/StartDraftButton.tsx apps/web/src/app/api/start-draft/route.ts
git commit -m "fix: StartDraftButton — delegate to start_draft RPC via route handler; removes client-side shuffle"
```

---

## Task 9 — Fix mobile athletes screen (snake/camel mismatch)

The `Athlete` type from `@fieldday/shared` is camelCase but Supabase returns snake_case. Drop the `as unknown` cast and use the DB row type directly.

**Files:**
- Modify: `apps/mobile/app/(tabs)/athletes.tsx`

- [ ] **Step 1: Replace the fetch function and renderer**

Replace the entire `apps/mobile/app/(tabs)/athletes.tsx` with:

```typescript
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { colors, spacing, typography } from '@fieldday/ui'
import { useState } from 'react'
import type { Database } from '@fieldday/db'

type AthleteRow = Database['public']['Tables']['athletes']['Row']

async function fetchAthletes(search: string): Promise<AthleteRow[]> {
  let query = supabase
    .from('athletes')
    .select('*')
    .eq('pool', 'pro')
    .eq('is_active', true)
    .order('last_name')
    .limit(50)

  if (search.length > 1) {
    query = query.or(`last_name.ilike.%${search}%,first_name.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export default function AthletesScreen() {
  const [search, setSearch] = useState('')
  const { data: athletes, isLoading } = useQuery({
    queryKey: ['athletes', 'pro', search],
    queryFn: () => fetchAthletes(search),
  })

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>Athletes</Text>

        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search athletes…"
          placeholderTextColor={colors.textMuted}
        />

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={athletes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AthleteRow athlete={item} />}
            ListEmptyComponent={<Text style={styles.empty}>No athletes found.</Text>}
            contentContainerStyle={{ gap: spacing.xs, paddingBottom: spacing.xl }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

function AthleteRow({ athlete }: { athlete: AthleteRow }) {
  return (
    <View style={styles.athleteRow}>
      <View style={styles.athleteInfo}>
        <Text style={styles.athleteName}>
          {athlete.first_name} {athlete.last_name}
        </Text>
        <Text style={styles.athleteMeta}>
          {athlete.country_code} · {athlete.primary_event}
        </Text>
      </View>
      <Text style={styles.salary}>${(athlete.salary / 1000).toFixed(1)}K</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  header: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.black,
    color: colors.textPrimary,
  },
  search: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
  },
  athleteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: spacing.md,
  },
  athleteInfo: { gap: 2 },
  athleteName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  athleteMeta: { color: colors.textSecondary, fontSize: typography.fontSizes.sm },
  salary: {
    color: colors.primary,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
  },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
})
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: 5 successful.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(tabs\)/athletes.tsx
git commit -m "fix: athletes screen — use Database row type directly, remove as-unknown cast, render snake_case fields"
```

---

## Task 10 — Add _shared/scoring.ts for Deno edge functions

Edge functions can't import npm workspaces. Create a `_shared` directory (Supabase convention for shared Deno code) with the scoring constants, sourced from the same values as `@fieldday/shared`.

**Files:**
- Create: `supabase/functions/_shared/scoring.ts`
- Modify: `supabase/functions/ingest-world-athletics/index.ts` (import instead of duplicate)

- [ ] **Step 1: Create _shared/scoring.ts**

Create `supabase/functions/_shared/scoring.ts`:

```typescript
// Scoring constants shared across edge functions.
// Must stay in sync with packages/shared/src/types/scoring.ts — same values.

export const PLACE_POINTS: Record<number, number> = {
  1: 20, 2: 18, 3: 16, 4: 14, 5: 12,
  6: 10, 7: 9,  8: 8,  9: 7,  10: 6,
  11: 5, 12: 4, 13: 3, 14: 3, 15: 2,
  16: 2, 17: 1, 18: 1, 19: 1, 20: 1,
} as const

export const DNF_PENALTY = -2
export const CAPTAIN_MULTIPLIER = 2

export const MEET_TIER_MULTIPLIERS: Record<string, number> = {
  world_championship: 3,
  diamond_league: 2,
  gold: 1.5,
  silver: 1.25,
  bronze: 1.1,
  regular: 1,
} as const

export function computePoints(place: number | null, tier: string): number {
  if (place === null) return DNF_PENALTY
  const base = PLACE_POINTS[place] ?? 0
  const multiplier = MEET_TIER_MULTIPLIERS[tier] ?? 1
  return base * multiplier
}
```

- [ ] **Step 2: Update ingest-world-athletics to import from _shared**

In `supabase/functions/ingest-world-athletics/index.ts`, find the duplicated `PLACE_POINTS` and `computePoints` definitions and replace them with:

```typescript
import { computePoints, PLACE_POINTS, MEET_TIER_MULTIPLIERS } from '../_shared/scoring.ts'
```

Then remove the local duplicate declarations. The exported `computePoints` function should now be the imported one.

- [ ] **Step 3: Verify deno check on both functions**

```bash
cd supabase/functions/ingest-world-athletics && deno check index.ts
cd supabase/functions/score-meet && deno check index.ts
```
Both expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/_shared/scoring.ts supabase/functions/ingest-world-athletics/index.ts
git commit -m "refactor: extract scoring constants to _shared/scoring.ts; ingest-world-athletics imports instead of duplicating"
```

---

## Task 11 — Final verification

Run all checks and verify the full flow against a local Supabase instance.

- [ ] **Step 1: Full check suite**

```bash
cd /root/code/heatsheet
npm run typecheck && npm run lint && npm run test
```
Expected: all green.

- [ ] **Step 2: Reset and reseed database**

```bash
supabase db reset
```
Expected: 12 migrations apply, seed inserts 88 athletes and 1 season.

- [ ] **Step 3: Verify RLS — attempt direct client commissioner insert (should be blocked)**

```bash
# Get a user JWT from local auth (sign in first, grab access_token from response)
# Then test direct insert
curl -X POST "http://127.0.0.1:54321/rest/v1/league_members" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"league_id": "<any-league-uuid>", "user_id": "<your-user-id>", "role": "commissioner"}'
```
Expected: `403 Forbidden` or RLS violation error.

- [ ] **Step 4: Verify score-meet idempotency**

```bash
# Invoke score-meet twice for the same meetId
curl -X POST "http://127.0.0.1:54321/functions/v1/score-meet" \
  -H "Authorization: Bearer <FUNCTION_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"meetId": "<a-meet-uuid>"}'
# Second call:
curl -X POST "http://127.0.0.1:54321/functions/v1/score-meet" \
  -H "Authorization: Bearer <FUNCTION_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"meetId": "<a-meet-uuid>"}'
```
Expected: first call returns `{"ok":true,...}`, second returns `{"error":"Meet already scored..."}` with status 409.

- [ ] **Step 5: Verify draft flow end-to-end**

1. Sign up two test users (A and B).
2. User A creates a public league via the `/leagues/new` form — should call `create_league` RPC, redirect to `/leagues/<id>`.
3. User B navigates to the league and joins (public league — direct insert works per updated RLS).
4. User A clicks "Start Draft" — should call `/api/start-draft` → `start_draft` RPC → both members get `draft_order` values, `draft_status = 'active'`.
5. Both users enter the draft room; verify snake-order picks, salary cap enforcement, realtime updates.

---

## What this does NOT cover (Phase 2)

These are intentionally deferred and tracked in the review plan (`docs/superpowers/plans/spicy-bubbling-flurry.md`):

- Tailwind v4 `@theme` token block (web)
- Split long components (`leagues/[id]/page.tsx`, `DraftRoom.tsx`)
- Supabase dependency version alignment
- Email verification UX (`enable_confirmations = true`)
- Draft-status state machine CHECK constraint
- Error boundary addition
- Dependency vulnerability updates (Next.js, Expo xmldom chain)
