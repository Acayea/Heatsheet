import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leagueId } = await request.json() as { leagueId: string }
  if (!leagueId) return NextResponse.json({ error: 'leagueId required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('start_draft', { p_league_id: leagueId })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'P0001' ? 400 : 500 })
  }

  return NextResponse.json({ ok: true })
}
