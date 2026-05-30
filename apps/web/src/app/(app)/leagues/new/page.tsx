import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewLeagueForm } from './NewLeagueForm'

export default async function NewLeaguePage() {
  const supabase = await createClient()
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name')
    .in('status', ['upcoming', 'active'])
    .order('starts_at')

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 md:pb-6">
      <div>
        <Link href="/leagues" className="mb-2 block text-sm text-zinc-500 hover:text-zinc-300">
          ← My Leagues
        </Link>
        <h1 className="text-2xl font-black text-white">Create a League</h1>
      </div>
      <NewLeagueForm seasons={seasons ?? []} />
    </div>
  )
}
