import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function signOut() {
    'use server'
    const supabaseServer = await createClient()
    await supabaseServer.auth.signOut()
    redirect('/auth/sign-in')
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-black text-white">Profile</h1>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8FF00] text-2xl font-black text-[#0D0D0D]">
          {user?.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <p className="text-zinc-400">{user?.email}</p>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-xl border border-red-600 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-600/10"
        >
          Sign Out
        </button>
      </form>
    </div>
  )
}
