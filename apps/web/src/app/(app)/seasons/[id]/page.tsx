import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const TIER_STYLES: Record<string, { label: string; color: string }> = {
  world_championship: { label: 'World Championship', color: 'text-[#E8FF00] bg-[#E8FF00]/10 border-[#E8FF00]/20' },
  diamond_league:     { label: 'Diamond League',     color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  gold:               { label: 'Gold',               color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  silver:             { label: 'Silver',             color: 'text-zinc-300 bg-zinc-300/10 border-zinc-300/20' },
  bronze:             { label: 'Bronze',             color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  regular:            { label: 'Regular',            color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' },
}

const MULTIPLIERS: Record<string, number> = {
  world_championship: 3,
  diamond_league: 2,
  gold: 1.5,
  silver: 1.25,
  bronze: 1.1,
  regular: 1,
}

function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', ...opts,
  })
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function SeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: season }, { data: meets }] = await Promise.all([
    supabase.from('seasons').select('*').eq('id', id).single(),
    supabase.from('meets').select('*').eq('season_id', id).order('starts_at'),
  ])

  if (!season) notFound()

  const draftDays = daysUntil(season.draft_opens_at)
  const seasonDays = daysUntil(season.starts_at)

  return (
    <div className="flex flex-col gap-8 p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <Link href="/seasons" className="mb-2 text-sm text-zinc-500 hover:text-zinc-300">
          ← Seasons
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-white">{season.name}</h1>
          {season.status === 'active' && (
            <span className="rounded-full bg-[#E8FF00]/10 px-3 py-1 text-xs font-bold text-[#E8FF00]">LIVE</span>
          )}
          {season.status === 'upcoming' && (
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-400">UPCOMING</span>
          )}
        </div>
        <p className="text-zinc-500">
          {formatDate(season.starts_at)} – {formatDate(season.ends_at)}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Salary Cap', value: `$${(season.salary_cap / 1000).toFixed(0)}K` },
          { label: 'Roster Size', value: `${season.roster_size} athletes` },
          { label: 'Starters', value: `${season.starting_slots} of ${season.roster_size}` },
          { label: 'Draft Opens', value: draftDays > 0 ? `${draftDays}d away` : 'Open' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-lg font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Countdown */}
      {season.status === 'upcoming' && seasonDays > 0 && (
        <div className="rounded-xl border border-[#E8FF00]/20 bg-[#E8FF00]/5 p-5">
          <p className="text-sm text-zinc-400">Season starts in</p>
          <p className="text-4xl font-black text-[#E8FF00]">{seasonDays} days</p>
          <p className="mt-3 text-sm text-zinc-500">
            Draft opens {formatDate(season.draft_opens_at)}. Create or join a league to compete.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/leagues"
              className="rounded-lg bg-[#E8FF00] px-4 py-2 text-sm font-bold text-[#0D0D0D] transition-opacity hover:opacity-90"
            >
              Create a League
            </Link>
            <Link
              href="/leagues"
              className="rounded-lg border border-[#2A2A2A] px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500"
            >
              Join a League
            </Link>
          </div>
        </div>
      )}

      {/* Meets */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">
          Meet Schedule <span className="ml-1 text-sm font-normal text-zinc-500">({meets?.length ?? 0} meets)</span>
        </h2>

        {meets && meets.length > 0 ? (
          <div className="flex flex-col gap-2">
            {meets.map((meet) => {
              const tier = TIER_STYLES[meet.tier] ?? TIER_STYLES['regular']!
              const multiplier = MULTIPLIERS[meet.tier] ?? 1
              const isPast = new Date(meet.ends_at) < new Date()
              return (
                <div
                  key={meet.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                    meet.is_scored
                      ? 'border-[#2A2A2A] bg-[#111111] opacity-60'
                      : 'border-[#2A2A2A] bg-[#1A1A1A]'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tier.color}`}>
                        {tier.label}
                      </span>
                      {meet.is_scored && (
                        <span className="text-xs text-zinc-600">Scored</span>
                      )}
                    </div>
                    <p className={`font-semibold ${isPast ? 'text-zinc-400' : 'text-white'}`}>
                      {meet.name}
                    </p>
                    <p className="text-sm text-zinc-500">{meet.location}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-zinc-300">
                      {formatDate(meet.starts_at, { month: 'short', day: 'numeric', year: undefined })}
                      {meet.starts_at.slice(0, 10) !== meet.ends_at.slice(0, 10) && (
                        <>–{formatDate(meet.ends_at, { month: 'short', day: 'numeric', year: undefined })}</>
                      )}
                    </p>
                    <p className="text-xs text-zinc-600">{multiplier}× pts</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-8 text-center text-zinc-500">
            Meet schedule coming soon.
          </div>
        )}
      </div>

      {/* Scoring guide */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">Scoring</h2>
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">1st place</p>
              <p className="mt-1 text-2xl font-black text-white">20 pts</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">2nd place</p>
              <p className="mt-1 text-2xl font-black text-white">18 pts</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">3rd place</p>
              <p className="mt-1 text-2xl font-black text-white">16 pts</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">DNF / DQ</p>
              <p className="mt-1 text-2xl font-black text-red-500">−2 pts</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            Captain scores 2×. Meet tier multipliers apply: World Champs 3×, Diamond League 2×, Gold 1.5×.
          </p>
        </div>
      </div>
    </div>
  )
}
