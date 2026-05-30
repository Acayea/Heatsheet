create type public.roster_slot_type as enum ('starter', 'bench', 'captain');
create type public.finish_result as enum ('completed', 'dnf', 'dns', 'dq', 'nh', 'nm');

-- Rosters (one per user per league)
create table public.rosters (
  id                  uuid primary key default gen_random_uuid(),
  league_id           uuid not null references public.leagues(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  season_id           uuid not null references public.seasons(id),
  total_salary_used   integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint rosters_unique unique (league_id, user_id)
);

create index rosters_user_id_idx on public.rosters (user_id);

create trigger rosters_updated_at
  before update on public.rosters
  for each row execute procedure public.set_updated_at();

alter table public.rosters enable row level security;

create policy "Members can read rosters in their leagues"
  on public.rosters for select
  using (
    exists (
      select 1 from public.league_members
      where league_id = rosters.league_id and user_id = auth.uid()
    )
  );

create policy "Users can manage their own roster"
  on public.rosters for all
  using (auth.uid() = user_id);

-- Roster athletes (many-to-many with slot assignment)
create table public.roster_athletes (
  id          uuid primary key default gen_random_uuid(),
  roster_id   uuid not null references public.rosters(id) on delete cascade,
  athlete_id  uuid not null references public.athletes(id),
  slot_type   public.roster_slot_type not null default 'starter',
  acquired_at timestamptz not null default now(),
  dropped_at  timestamptz -- null = currently on roster
);

create index roster_athletes_roster_id_idx on public.roster_athletes (roster_id);
create index roster_athletes_athlete_id_idx on public.roster_athletes (athlete_id);

-- Only one captain per roster at a time
create unique index roster_one_captain_idx
  on public.roster_athletes (roster_id)
  where slot_type = 'captain' and dropped_at is null;

alter table public.roster_athletes enable row level security;

create policy "Members can read roster athletes in their leagues"
  on public.roster_athletes for select
  using (
    exists (
      select 1 from public.rosters r
      join public.league_members lm on lm.league_id = r.league_id
      where r.id = roster_id and lm.user_id = auth.uid()
    )
  );

create policy "Users can manage their own roster athletes"
  on public.roster_athletes for all
  using (
    exists (
      select 1 from public.rosters
      where id = roster_id and user_id = auth.uid()
    )
  );

-- Scoring events (immutable results)
create table public.scoring_events (
  id                      uuid primary key default gen_random_uuid(),
  meet_id                 uuid not null references public.meets(id),
  athlete_id              uuid not null references public.athletes(id),
  event                   text not null,
  place                   integer check (place > 0),
  result                  public.finish_result not null,
  mark                    text, -- e.g. "9.85", "2.35m"
  base_points             integer not null default 0,
  tier_multiplier         numeric(4,2) not null default 1.0,
  total_points            numeric(6,2) not null,
  dnf_insurance_applied   boolean not null default false,
  created_at              timestamptz not null default now(),
  constraint scoring_events_unique unique (meet_id, athlete_id, event)
);

create index scoring_events_meet_id_idx on public.scoring_events (meet_id);
create index scoring_events_athlete_id_idx on public.scoring_events (athlete_id);

-- Scoring events are read-only for users; admin/service role writes
alter table public.scoring_events enable row level security;

create policy "Anyone can read scoring events"
  on public.scoring_events for select
  using (true);

create policy "Admins can write scoring events"
  on public.scoring_events for all
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- DNF Insurance tokens (one per user per season)
create table public.dnf_insurance_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  season_id   uuid not null references public.seasons(id),
  used        boolean not null default false,
  used_at     timestamptz,
  created_at  timestamptz not null default now(),
  constraint dnf_insurance_unique unique (user_id, season_id)
);

alter table public.dnf_insurance_tokens enable row level security;

create policy "Users can read their own insurance tokens"
  on public.dnf_insurance_tokens for select
  using (auth.uid() = user_id);

create policy "Users can use their own insurance tokens"
  on public.dnf_insurance_tokens for update
  using (auth.uid() = user_id);
