import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DraftRoom } from './DraftRoom'

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: league }, { data: members }, { data: athletes }, { data: picks }] = await Promise.all([
    supabase
      .from('leagues')
      .select('*, season:seasons(id, name, salary_cap, roster_size, starting_slots)')
      .eq('id', id)
      .single(),
    supabase
      .from('league_members')
      .select('user_id, draft_order, role')
      .eq('league_id', id)
      .order('draft_order'),
    supabase
      .from('athletes')
      .select('id, first_name, last_name, primary_event, country_code, salary, gender')
      .eq('pool', 'pro')
      .eq('is_active', true)
      .order('salary', { ascending: false }),
    supabase
      .from('draft_picks')
      .select('pick_number, user_id, athlete_id, salary, athlete:athletes(first_name, last_name, primary_event)')
      .eq('league_id', id)
      .order('pick_number'),
  ])

  if (!league) notFound()
  if (league.draft_status === 'pending') redirect(`/leagues/${id}`)
  if (!members?.some((m) => m.user_id === user.id)) redirect(`/leagues/${id}`)

  // Fetch display names separately
  const userIds = members?.map((m) => m.user_id) ?? []
  const { data: profiles } = userIds.length
    ? await supabase.from('user_profiles').select('user_id, display_name').in('user_id', userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]))

  const membersWithNames = (members ?? []).map((m) => ({
    ...m,
    display_name: profileMap.get(m.user_id) ?? m.user_id.slice(0, 8),
  }))

  return (
    <DraftRoom
      leagueId={id}
      currentUserId={user.id}
      league={league as never}
      members={membersWithNames}
      athletes={athletes ?? []}
      initialPicks={picks ?? []}
    />
  )
}
