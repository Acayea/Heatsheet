import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const DISCIPLINE_LABEL: Record<string, string> = {
  indoor: 'Indoor',
  outdoor: 'Outdoor',
  cross_country: 'Cross Country',
}

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  upcoming: { badge: 'bg-zinc-800 text-zinc-400', label: 'Upcoming' },
  active: { badge: 'bg-[#E8FF00]/10 text-[#E8FF00]', label: 'Live' },
  completed: { badge: 'bg-zinc-800 text-zinc-500', label: 'Completed' },
}

export default async function SeasonsPage() {
  const supabase = await createClient()
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('starts_at')

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-black text-white">Seasons</h1>
        <p className="text-sm text-zinc-500">Six seasons across pro and college track & field.</p>
      </div>

      {seasons && seasons.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => {
            const style = STATUS_STYLES[season.status] ?? STATUS_STYLES['upcoming']!
            return (
              <Link
                key={season.id}
                href={`/seasons/${season.id}`}
                className="flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5 transition-colors hover:border-zinc-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {season.level === 'pro' ? 'Pro' : 'College'} · {DISCIPLINE_LABEL[season.discipline]}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-white">{season.name}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
                    {style.label}
                  </span>
                </div>

                <div className="flex gap-4 text-sm text-zinc-400">
                  <span>
                    {new Date(season.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' – '}
                    {new Date(season.ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex gap-4 border-t border-[#2A2A2A] pt-3 text-xs text-zinc-500">
                  <span>${(season.salary_cap / 1000).toFixed(0)}K cap</span>
                  <span>{season.roster_size} athletes</span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-8 text-center text-zinc-500">
          No seasons available yet.
        </div>
      )}
    </div>
  )
}
