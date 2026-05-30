-- Draft picks: one row per selection made during a snake draft
create table public.draft_picks (
  id            uuid primary key default gen_random_uuid(),
  league_id     uuid not null references public.leagues(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  athlete_id    uuid not null references public.athletes(id),
  pick_number   integer not null,   -- overall pick (1, 2, 3…)
  round_number  integer not null,   -- which round
  salary        integer not null,   -- athlete salary locked at draft time
  picked_at     timestamptz not null default now(),
  constraint draft_picks_pick_unique unique (league_id, pick_number),
  constraint draft_picks_athlete_unique unique (league_id, athlete_id)
);

create index draft_picks_league_id_idx on public.draft_picks (league_id);
create index draft_picks_user_id_idx on public.draft_picks (user_id);

alter table public.draft_picks enable row level security;

-- All league members can read picks (needed for real-time draft board)
create policy "League members can read draft picks"
  on public.draft_picks for select
  using (
    exists (
      select 1 from public.league_members
      where league_id = draft_picks.league_id and user_id = auth.uid()
    )
  );

-- Insert handled by edge function using service role key
-- Users cannot insert directly
