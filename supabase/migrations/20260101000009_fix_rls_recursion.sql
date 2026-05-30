-- Fix infinite recursion in league_members and leagues RLS policies.
-- The self-referential league_members policy causes a loop when leagues
-- queries league_members which re-triggers its own RLS.
-- Solution: security definer function that checks membership without RLS.

create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.league_members
    where league_id = p_league_id and user_id = auth.uid()
  );
$$;

-- Drop recursive league_members policy and replace with a simple one
drop policy if exists "Members can read league membership" on public.league_members;

create policy "Members can read league membership"
  on public.league_members for select
  using (public.is_league_member(league_id));

-- Drop recursive private leagues policy and replace using the function
drop policy if exists "Members can read their private leagues" on public.leagues;

create policy "Members can read their private leagues"
  on public.leagues for select
  using (
    type = 'private' and public.is_league_member(id)
  );
