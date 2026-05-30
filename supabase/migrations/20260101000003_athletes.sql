create type public.athlete_pool as enum ('pro', 'college');
create type public.athlete_gender as enum ('men', 'women');

create table public.athletes (
  id                  uuid primary key default gen_random_uuid(),
  pool                public.athlete_pool not null,
  gender              public.athlete_gender not null,
  first_name          text not null,
  last_name           text not null,
  country_code        text not null, -- ISO 3166-1 alpha-3 for pro; school abbr for college
  primary_event       text not null,
  events              text[] not null default '{}',
  photo_url           text,
  world_athletics_id  text, -- populated once API contract is signed
  salary              integer not null check (salary > 0), -- fantasy credits
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint athletes_world_athletics_id_key unique (world_athletics_id)
);

create index athletes_pool_gender_idx on public.athletes (pool, gender);
create index athletes_primary_event_idx on public.athletes (primary_event);
create index athletes_is_active_idx on public.athletes (is_active);

create trigger athletes_updated_at
  before update on public.athletes
  for each row execute procedure public.set_updated_at();

-- RLS: athletes are public read, admin write
alter table public.athletes enable row level security;

create policy "Anyone can read active athletes"
  on public.athletes for select
  using (is_active = true);

create policy "Admins can manage athletes"
  on public.athletes for all
  using (
    exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'admin'
    )
  );
