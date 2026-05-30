'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function StartDraftButton({
  leagueId,
  memberCount,
}: {
  leagueId: string
  memberCount: number
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function startDraft() {
    if (memberCount < 2) {
      setError('Need at least 2 members to start the draft.')
      return
    }
    setIsLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    const res = await fetch('/api/start-draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ leagueId }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError((body as { error?: string }).error ?? 'Failed to start draft')
      setIsLoading(false)
      return
    }

    router.refresh()
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={startDraft}
        disabled={isLoading || memberCount < 2}
        className="rounded-lg bg-[#E8FF00] px-4 py-2 text-sm font-bold text-[#0D0D0D] transition-opacity disabled:opacity-50"
      >
        {isLoading ? 'Starting…' : 'Start Draft'}
      </button>
      {memberCount < 2 && (
        <p className="text-xs text-zinc-500">Need at least 2 members</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
