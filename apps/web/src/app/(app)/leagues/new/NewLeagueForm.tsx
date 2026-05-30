'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreateLeagueSchema } from '@fieldday/shared'

interface Season {
  id: string
  name: string
}

export function NewLeagueForm({ seasons }: { seasons: Season[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<'public' | 'private'>('public')
  const [maxMembers, setMaxMembers] = useState(10)
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = CreateLeagueSchema.safeParse({ name, seasonId, type, maxMembers })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input')
      return
    }
    setError('')
    setIsLoading(true)

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: leagueId, error: rpcError } = await (supabase as any).rpc('create_league', {
      p_name: parsed.data.name,
      p_season_id: parsed.data.seasonId,
      p_type: parsed.data.type,
      p_max_members: parsed.data.maxMembers,
    }) as { data: string | null; error: { message: string } | null }

    if (rpcError || !leagueId) {
      setError(rpcError?.message ?? 'Failed to create league')
      setIsLoading(false)
      return
    }

    router.push(`/leagues/${leagueId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-5">
      {/* League name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-400">League Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. The Fast Lane"
          className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-white placeholder-zinc-600 focus:border-[#E8FF00] focus:outline-none"
        />
      </div>

      {/* Season */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-400">Season</label>
        <select
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
          className="rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-white focus:border-[#E8FF00] focus:outline-none"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-400">League Type</label>
        <div className="flex gap-2">
          {(['public', 'private'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold capitalize transition-colors ${
                type === t
                  ? 'border-[#E8FF00] bg-[#E8FF00]/10 text-[#E8FF00]'
                  : 'border-[#2A2A2A] text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          {type === 'private'
            ? 'An 8-character invite code will be generated for you to share.'
            : 'Anyone can find and join this league.'}
        </p>
      </div>

      {/* Max members */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-400">
          Max Members <span className="text-zinc-600">({maxMembers})</span>
        </label>
        <input
          type="range"
          min={2}
          max={20}
          value={maxMembers}
          onChange={(e) => setMaxMembers(Number(e.target.value))}
          className="accent-[#E8FF00]"
        />
        <div className="flex justify-between text-xs text-zinc-600">
          <span>2</span><span>20</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isLoading || !seasonId}
        className="rounded-xl bg-[#E8FF00] py-3 font-bold text-[#0D0D0D] transition-opacity disabled:opacity-50"
      >
        {isLoading ? 'Creating…' : 'Create League'}
      </button>
    </form>
  )
}
