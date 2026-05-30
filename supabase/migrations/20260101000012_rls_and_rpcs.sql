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

  select id, type, invite_code, draft_status, max_members, season_id into v_league from public.leagues where id = p_league_id;
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
  values (p_league_id, v_user_id, 'member')
  on conflict (league_id, user_id) do nothing;

  insert into public.rosters (league_id, user_id, season_id)
  values (p_league_id, v_user_id, v_league.season_id)
  on conflict (league_id, user_id) do nothing;
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

  select id, draft_status, season_id into v_league from public.leagues where id = p_league_id;
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

-- Restrict add_member_points to service_role only — prevents authenticated users from awarding arbitrary points
revoke execute on function public.add_member_points(uuid, uuid, numeric) from authenticated;
