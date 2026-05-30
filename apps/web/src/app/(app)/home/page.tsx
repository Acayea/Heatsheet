import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  // eslint-disable-next-line react-hooks/purity -- async server component; Date.now() runs server-side once per request
  const now = Date.now()

  const [{ data: { user } }, { data: seasons }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('seasons').select('*').in('status', ['active', 'upcoming']).order('starts_at').limit(3),
  ])

  return (
    <div className="flex flex-col gap-8 p-6 pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl font-black text-white">Home</h1>
        <p className="text-sm text-zinc-500">{user?.email}</p>
      </div>

      {/* Active / upcoming seasons */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-white">Seasons</h2>
          <Link href="/seasons" className="text-sm text-zinc-500 hover:text-zinc-300">View all →</Link>
        </div>

        {seasons && seasons.length > 0 ? (
          <div className="flex flex-col gap-3">
            {seasons.map((season) => {
              const draftDays = Math.ceil(
                (new Date(season.draft_opens_at).getTime() - now) / 86400000
              )
              return (
                <Link
                  key={season.id}
                  href={`/seasons/${season.id}`}
                  className="flex items-center justify-between rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 transition-colors hover:border-zinc-600"
                >
                  <div>
                    <p className="font-semibold text-white">{season.name}</p>
                    <p className="text-sm text-zinc-500">
                      {new Date(season.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' – '}
                      {new Date(season.ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    {season.status === 'active' ? (
                      <span className="rounded-full bg-[#E8FF00]/10 px-2.5 py-1 text-xs font-bold text-[#E8FF00]">LIVE</span>
                    ) : draftDays > 0 ? (
                      <span className="text-sm font-semibold text-zinc-400">Draft in {draftDays}d</span>
                    ) : (
                      <span className="text-sm font-semibold text-[#E8FF00]">Draft open</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-8 text-center text-zinc-500">
            No active seasons right now.
          </div>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="mb-3 font-bold text-white">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/leagues', label: 'My Leagues', icon: '👥' },
            { href: '/athletes', label: 'Athletes', icon: '⚡' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 transition-colors hover:border-zinc-600"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-white">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
