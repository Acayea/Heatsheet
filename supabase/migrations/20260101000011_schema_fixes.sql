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
