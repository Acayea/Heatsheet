create type public.season_level as enum ('pro', 'college');
create type public.season_discipline as enum ('indoor', 'outdoor', 'cross_country');
create type public.season_status as enum ('upcoming', 'active', 'completed');
create type public.meet_tier as enum (
  'world_championship', 'diamond_league', 'gold', 'silver', 'bronze', 'regular'
);

create table public.seasons (
  id              uuid primary key default gen_random_uuid(),
  level           public.season_level not null,
  discipline      public.season_discipline not null,
  name            text not null,
  status          public.season_status not null default 'upcoming',
  draft_opens_at  timestamptz not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  salary_cap      integer not null default 50000,
  roster_size     integer not null default 8,
  starting_slots  integer not null default 6,
  created_at      timestamptz not null default now(),
  constraint seasons_dates_check check (draft_opens_at < starts_at and starts_at < ends_at)
);

-- RLS: seasons are public
alter table public.seasons enable row level security;

create policy "Anyone can read seasons"
  on public.seasons for select
  using (true);

create policy "Admins can manage seasons"
  on public.seasons for all
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Meets
create table public.meets (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid not null references public.seasons(id) on delete cascade,
  name        text not null,
  location    text not null,
  tier        public.meet_tier not null default 'regular',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  is_scored   boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint meets_dates_check check (starts_at <= ends_at)
);

create index meets_season_id_idx on public.meets (season_id);
create index meets_starts_at_idx on public.meets (starts_at);

alter table public.meets enable row level security;

create policy "Anyone can read meets"
  on public.meets for select
  using (true);

create policy "Admins can manage meets"
  on public.meets for all
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );
