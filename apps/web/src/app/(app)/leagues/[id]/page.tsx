import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StartDraftButton } from './StartDraftButton'

const TIER_LABELS: Record<string, string> = {
  world_championship: 'Worlds',
  diamond_league: 'Diamond League',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  regular: 'Regular',
}

const TIER_COLORS: Record<string, string> = {
  world_championship: 'text-[#E8FF00] bg-[#E8FF00]/10',
  diamond_league: 'text-blue-400 bg-blue-400/10',
  gold: 'text-yellow-400 bg-yellow-400/10',
  silver: 'text-zinc-300 bg-zinc-300/10',
  bronze: 'text-orange-400 bg-orange-400/10',
  regular: 'text-zinc-500 bg-zinc-800',
}

export default async function LeagueHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: league }, { data: members }, { data: picks }] = await Promise.all([
    supabase
      .from('leagues')
      .select('*, season:seasons(id, name, salary_cap, roster_size, starting_slots)')
      .eq('id', id)
      .single(),
    supabase
      .from('league_members')
      .select('user_id, role, draft_order, total_points')
      .eq('league_id', id)
      .order('draft_order'),
    supabase
      .from('draft_picks')
      .select('user_id, pick_number, salary, athlete:athletes(first_name, last_name, primary_event)')
      .eq('league_id', id)
      .order('pick_number'),
  ])

  if (!league) notFound()

  type Season = { id: string; name: string; salary_cap: number; roster_size: number; starting_slots: number }
  const season = league.season as Season | null

  // Fetch profiles, meets, and current user's role in parallel
  const userIds = members?.map((m) => m.user_id) ?? []
  const [{ data: profiles }, { data: meets }] = await Promise.all([
    userIds.length
      ? supabase.from('user_profiles').select('user_id, display_name').in('user_id', userIds)
      : { data: [] },
    season
      ? supabase
          .from('meets')
          .select('id, name, location, tier, starts_at, ends_at, is_scored')
          .eq('season_id', season.id)
          .order('starts_at')
      : { data: [] },
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]))
  const isCommissioner = members?.some((m) => m.user_id === user?.id && m.role === 'commissioner')
  const totalPicks = (members?.length ?? 0) * (season?.roster_size ?? 8)
  const draftComplete = totalPicks > 0 && (picks?.length ?? 0) >= totalPicks
  const startingSlots = season?.starting_slots ?? 6

  // Post-draft: build per-user pick lists (already sorted by pick_number)
  const picksByUser = new Map<string, typeof picks>()
  for (const member of members ?? []) {
    picksByUser.set(member.user_id, (picks ?? []).filter((p) => p.user_id === member.user_id))
  }

  const standings = [...(members ?? [])].sort((a, b) => b.total_points - a.total_points)
  const now = new Date()

  return (
    <div className="flex flex-col gap-8 p-6 pb-24 md:pb-6">
      {/* Header */}
      <div>
        <Link href="/leagues" className="mb-2 block text-sm text-zinc-500 hover:text-zinc-300">
          ← My Leagues
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">{league.name}</h1>
            <p className="text-sm text-zinc-500">{season?.name} · {league.type}</p>
          </div>
          {league.draft_status === 'active' && !draftComplete && (
            <Link
              href={`/leagues/${id}/draft`}
              className="shrink-0 rounded-lg bg-[#E8FF00] px-4 py-2 text-sm font-bold text-[#0D0D0D]"
            >
              Enter Draft →
            </Link>
          )}
        </div>
      </div>

      {/* ── PRE/ACTIVE DRAFT ── */}
      {!draftComplete && (
        <>
          <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Draft Status</p>
            {league.draft_status === 'pending' ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">Waiting to start</p>
                  <p className="text-sm text-zinc-500">
                    {members?.length ?? 0} of {league.max_members} members joined
                  </p>
                </div>
                {isCommissioner && (
                  <StartDraftButton leagueId={id} memberCount={members?.length ?? 0} />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#E8FF00]">Draft in progress</p>
                  <p className="text-sm text-zinc-500">
                    Pick {(picks?.length ?? 0) + 1} of {totalPicks}
                  </p>
                </div>
                <Link
                  href={`/leagues/${id}/draft`}
                  className="rounded-lg bg-[#E8FF00] px-4 py-2 text-sm font-bold text-[#0D0D0D]"
                >
                  Enter Draft Room →
                </Link>
              </div>
            )}
          </div>

          {league.type === 'private' && league.invite_code && isCommissioner && (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Invite Code</p>
              <p className="font-mono text-2xl font-black tracking-widest text-white">{league.invite_code}</p>
              <p className="mt-1 text-xs text-zinc-600">Share this code for others to join.</p>
            </div>
          )}

          <div>
            <h2 className="mb-3 font-bold text-white">
              Members <span className="text-sm font-normal text-zinc-500">({members?.length ?? 0})</span>
            </h2>
            <div className="flex flex-col gap-2">
              {members?.map((member) => {
                const displayName = profileMap.get(member.user_id) ?? member.user_id.slice(0, 8)
                const myPicks = picks?.filter((p) => p.user_id === member.user_id) ?? []
                const salaryUsed = myPicks.reduce((sum, p) => sum + p.salary, 0)
                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center justify-between rounded-xl border p-4 ${
                      member.user_id === user?.id
                        ? 'border-[#E8FF00]/20 bg-[#E8FF00]/5'
                        : 'border-[#2A2A2A] bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {member.draft_order && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                          {member.draft_order}
                        </span>
                      )}
                      <div>
                        <p className="font-semibold text-white">
                          {displayName}
                          {member.user_id === user?.id && (
                            <span className="ml-1.5 text-xs text-zinc-500">(you)</span>
                          )}
                        </p>
                        {member.role === 'commissioner' && (
                          <p className="text-xs text-zinc-600">Commissioner</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-zinc-300">{myPicks.length} picks</p>
                      <p className="text-xs text-zinc-600">
                        ${(salaryUsed / 1000).toFixed(1)}K / ${((season?.salary_cap ?? 50000) / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── POST-DRAFT ── */}
      {draftComplete && (
        <>
          {/* Standings */}
          <div>
            <h2 className="mb-3 font-bold text-white">Standings</h2>
            <div className="overflow-hidden rounded-xl border border-[#2A2A2A]">
              {standings.map((member, i) => {
                const displayName = profileMap.get(member.user_id) ?? member.user_id.slice(0, 8)
                const isMe = member.user_id === user?.id
                const userPicks = picksByUser.get(member.user_id) ?? []
                const salaryUsed = userPicks.reduce((sum, p) => sum + p.salary, 0)
                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center gap-4 border-b border-[#1A1A1A] px-4 py-3.5 last:border-b-0 ${
                      isMe ? 'bg-[#E8FF00]/5' : 'bg-[#1A1A1A]'
                    }`}
                  >
                    <span className={`w-5 text-center text-sm font-black ${i === 0 ? 'text-[#E8FF00]' : 'text-zinc-600'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${isMe ? 'text-white' : 'text-zinc-300'}`}>
                        {displayName}
                        {isMe && <span className="ml-1.5 text-xs font-normal text-zinc-500">(you)</span>}
                      </p>
                      <p className="text-xs text-zinc-600">
                        ${(salaryUsed / 1000).toFixed(1)}K spent · {userPicks.length} athletes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">{member.total_points}</p>
                      <p className="text-xs text-zinc-600">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Season schedule */}
          {meets && meets.length > 0 && (
            <div>
              <h2 className="mb-3 font-bold text-white">Schedule</h2>
              <div className="flex flex-col gap-2">
                {meets.map((meet) => {
                  const start = new Date(meet.starts_at)
                  const isPast = start < now
                  const tierLabel = TIER_LABELS[meet.tier] ?? meet.tier
                  const tierColor = TIER_COLORS[meet.tier] ?? TIER_COLORS.regular!
                  return (
                    <div
                      key={meet.id}
                      className={`flex items-center justify-between rounded-xl border p-4 ${
                        meet.is_scored
                          ? 'border-[#2A2A2A] bg-[#111] opacity-60'
                          : isPast
                          ? 'border-orange-500/20 bg-[#1A1A1A]'
                          : 'border-[#2A2A2A] bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white">{meet.name}</p>
                          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${tierColor}`}>
                            {tierLabel}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {meet.location} ·{' '}
                          {start.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="shrink-0 ml-4">
                        {meet.is_scored ? (
                          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-400">
                            Scored
                          </span>
                        ) : isPast ? (
                          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                            Pending
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-500">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Rosters */}
          <div>
            <h2 className="mb-3 font-bold text-white">Rosters</h2>
            <div className="flex flex-col gap-4">
              {standings.map((member) => {
                const displayName = profileMap.get(member.user_id) ?? member.user_id.slice(0, 8)
                const isMe = member.user_id === user?.id
                const userPicks = picksByUser.get(member.user_id) ?? []
                return (
                  <div
                    key={member.user_id}
                    className={`overflow-hidden rounded-xl border ${
                      isMe ? 'border-[#E8FF00]/20' : 'border-[#2A2A2A]'
                    }`}
                  >
                    {/* Roster header */}
                    <div
                      className={`flex items-center justify-between px-4 py-3 ${
                        isMe ? 'bg-[#E8FF00]/5' : 'bg-[#161616]'
                      }`}
                    >
                      <p className="font-bold text-white">
                        {displayName}
                        {isMe && (
                          <span className="ml-1.5 text-xs font-normal text-zinc-500">(you)</span>
                        )}
                      </p>
                      <span className="text-sm font-bold text-[#E8FF00]">
                        {member.total_points} pts
                      </span>
                    </div>

                    {/* Athletes */}
                    <div className="divide-y divide-[#222] bg-[#1A1A1A]">
                      {userPicks.map((pick, i) => {
                        const athlete = pick.athlete as {
                          first_name: string
                          last_name: string
                          primary_event: string
                        } | null
                        const isCapt = i === 0
                        const isBench = i >= startingSlots
                        const slotLabel = isCapt
                          ? 'C'
                          : isBench
                          ? `B${i - startingSlots + 1}`
                          : `S${i}`
                        return (
                          <div key={pick.pick_number} className="flex items-center gap-3 px-4 py-2.5">
                            <span
                              className={`w-6 shrink-0 text-center text-xs font-bold ${
                                isCapt
                                  ? 'text-[#E8FF00]'
                                  : isBench
                                  ? 'text-zinc-600'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {slotLabel}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`truncate text-sm font-semibold ${
                                  isCapt
                                    ? 'text-white'
                                    : isBench
                                    ? 'text-zinc-500'
                                    : 'text-zinc-200'
                                }`}
                              >
                                {athlete?.first_name} {athlete?.last_name}
                                {isCapt && (
                                  <span className="ml-1.5 text-xs font-normal text-[#E8FF00]">
                                    Captain ×2
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-zinc-600">{athlete?.primary_event}</p>
                            </div>
                            <span
                              className={`shrink-0 text-xs font-semibold ${
                                isCapt ? 'text-[#E8FF00]' : 'text-zinc-500'
                              }`}
                            >
                              ${(pick.salary / 1000).toFixed(1)}K
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
