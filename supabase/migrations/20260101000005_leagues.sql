create type public.league_type as enum ('public', 'private');
create type public.draft_status as enum ('pending', 'active', 'completed');
create type public.league_member_role as enum ('commissioner', 'member');

-- Create leagues table (no RLS yet — depends on league_members)
create table public.leagues (
  id              uuid primary key default gen_random_uuid(),
  season_id       uuid not null references public.seasons(id) on delete cascade,
  name            text not null,
  type            public.league_type not null default 'public',
  invite_code     text,
  max_members     integer not null default 10 check (max_members between 2 and 20),
  draft_status    public.draft_status not null default 'pending',
  draft_starts_at timestamptz,
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now(),
  constraint leagues_invite_code_key unique (invite_code),
  constraint private_league_needs_code check (
    type = 'public' or (type = 'private' and invite_code is not null)
  )
);

create index leagues_season_id_idx on public.leagues (season_id);
create index leagues_invite_code_idx on public.leagues (invite_code) where invite_code is not null;

-- Create league_members table
create table public.league_members (
  id            uuid primary key default gen_random_uuid(),
  league_id     uuid not null references public.leagues(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          public.league_member_role not null default 'member',
  draft_order   integer,
  total_points  integer not null default 0,
  joined_at     timestamptz not null default now(),
  constraint league_members_unique unique (league_id, user_id)
);

create index league_members_user_id_idx on public.league_members (user_id);
create index league_members_league_id_idx on public.league_members (league_id);

-- Now enable RLS on leagues (league_members exists now)
alter table public.leagues enable row level security;

create policy "Users can read public leagues"
  on public.leagues for select
  using (type = 'public');

create policy "Members can read their private leagues"
  on public.leagues for select
  using (
    type = 'private' and
    exists (
      select 1 from public.league_members
      where league_id = id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create leagues"
  on public.leagues for insert
  with check (auth.uid() = created_by);

create policy "Commissioners can update their leagues"
  on public.leagues for update
  using (
    exists (
      select 1 from public.league_members
      where league_id = id and user_id = auth.uid() and role = 'commissioner'
    )
  );

-- RLS on league_members
alter table public.league_members enable row level security;

create policy "Members can read league membership"
  on public.league_members for select
  using (
    exists (
      select 1 from public.league_members lm
      where lm.league_id = league_id and lm.user_id = auth.uid()
    )
  );

create policy "Authenticated users can join leagues"
  on public.league_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave leagues"
  on public.league_members for delete
  using (auth.uid() = user_id);
