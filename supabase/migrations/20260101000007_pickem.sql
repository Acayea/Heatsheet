-- Pick'em: lightweight prediction game (no draft required)
create table public.pickem_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  meet_id     uuid not null references public.meets(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  total_points integer not null default 0,
  constraint pickem_entries_unique unique (user_id, meet_id)
);

create index pickem_entries_user_id_idx on public.pickem_entries (user_id);
create index pickem_entries_meet_id_idx on public.pickem_entries (meet_id);

alter table public.pickem_entries enable row level security;

create policy "Users can read any pickem entry"
  on public.pickem_entries for select
  using (true);

create policy "Users can manage their own pickem entries"
  on public.pickem_entries for all
  using (auth.uid() = user_id);

-- Individual picks within an entry
create table public.pickem_picks (
  id              uuid primary key default gen_random_uuid(),
  entry_id        uuid not null references public.pickem_entries(id) on delete cascade,
  event           text not null,
  athlete_id      uuid not null references public.athletes(id),
  is_correct      boolean, -- null until scored
  points_awarded  integer not null default 0,
  created_at      timestamptz not null default now(),
  constraint pickem_picks_unique unique (entry_id, event)
);

create index pickem_picks_entry_id_idx on public.pickem_picks (entry_id);

alter table public.pickem_picks enable row level security;

create policy "Users can read any pickem pick"
  on public.pickem_picks for select
  using (true);

create policy "Users can manage picks in their own entries"
  on public.pickem_picks for all
  using (
    exists (
      select 1 from public.pickem_entries
      where id = entry_id and user_id = auth.uid()
    )
  );
