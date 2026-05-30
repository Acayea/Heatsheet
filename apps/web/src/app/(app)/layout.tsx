import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/seasons', label: 'Seasons', icon: '🏆' },
  { href: '/leagues', label: 'My Leagues', icon: '👥' },
  { href: '/athletes', label: 'Athletes', icon: '⚡' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/sign-in')

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      {/* Sidebar */}
      <nav className="hidden w-56 flex-col border-r border-[#2A2A2A] p-6 md:flex">
        <Link href="/home" className="mb-8 text-xl font-black text-[#E8FF00] tracking-tight">
          FIELDDAY
        </Link>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-[#1A1A1A] hover:text-white"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-[#2A2A2A] bg-[#111111] md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-zinc-500 hover:text-white"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
