import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function LeaguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memberships } = await supabase
    .from('league_members')
    .select('role, total_points, league:leagues(id, name, type, draft_status, season:seasons(name))')
    .eq('user_id', user!.id)

  const leagues = memberships?.map((m) => ({
    ...(m.league as { id: string; name: string; type: string; draft_status: string; season: { name: string } | null }),
    myRole: m.role,
    myPoints: m.total_points,
  })) ?? []

  const DRAFT_STATUS_STYLE: Record<string, string> = {
    pending: 'text-zinc-500',
    active: 'text-[#E8FF00] font-semibold',
    completed: 'text-zinc-600',
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">My Leagues</h1>
        <Link
          href="/leagues/new"
          className="rounded-lg bg-[#E8FF00] px-4 py-2 text-sm font-bold text-[#0D0D0D]"
        >
          + New League
        </Link>
      </div>

      {leagues.length > 0 ? (
        <div className="flex flex-col gap-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="flex items-center justify-between rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 transition-colors hover:border-zinc-600"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{league.name}</span>
                  {league.myRole === 'commissioner' && (
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">Commissioner</span>
                  )}
                </div>
                <span className="text-sm text-zinc-500">{league.season?.name}</span>
              </div>
              <div className="text-right">
                <p className={`text-sm capitalize ${DRAFT_STATUS_STYLE[league.draft_status]}`}>
                  {league.draft_status === 'active' ? '🟡 Draft Live' : league.draft_status}
                </p>
                <p className="text-xs text-zinc-600">{league.myPoints} pts</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-12 text-center">
          <p className="text-zinc-500">You haven&apos;t joined any leagues yet.</p>
          <Link
            href="/leagues/new"
            className="rounded-lg bg-[#E8FF00] px-5 py-2.5 text-sm font-bold text-[#0D0D0D]"
          >
            Create your first league
          </Link>
        </div>
      )}
    </div>
  )
}
