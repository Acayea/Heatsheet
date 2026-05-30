-- Simpler league_members SELECT policy.
-- The previous policy only used is_league_member(), which caused issues
-- when the user's own row wasn't yet visible during the RLS evaluation.
-- Adding `auth.uid() = user_id` as a direct first check means a user
-- can always see their own rows without any recursive function call.
-- is_league_member() (security definer) handles viewing other members' rows.

drop policy if exists "Members can read league membership" on public.league_members;

create policy "Members can read league membership"
  on public.league_members for select
  using (
    auth.uid() = user_id
    or public.is_league_member(league_id)
  );
