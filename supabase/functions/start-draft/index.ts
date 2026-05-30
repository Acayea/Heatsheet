/**
 * start-draft
 *
 * Delegates to the start_draft(p_league_id) SQL RPC.
 * The RPC validates commissioner role, randomises draft order
 * via pgcrypto, and atomically transitions draft_status to 'active'.
 *
 * Auth: user JWT (supabase.auth.getUser)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.101.1'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !user) return new Response('Unauthorized', { status: 401 })

  let leagueId: string
  try {
    const body = await req.json()
    leagueId = body.leagueId
    if (!leagueId || typeof leagueId !== 'string') throw new Error('leagueId required')
  } catch (e) {
    return json({ error: String(e) }, 400)
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(leagueId)) {
    return json({ error: 'leagueId must be a valid UUID' }, 400)
  }

  // Use the user's token to call the RPC — RPC checks commissioner role via auth.uid()
  const { error: rpcError } = await supabaseUser.rpc('start_draft', {
    p_league_id: leagueId,
  })

  if (rpcError) {
    console.error('[start-draft] RPC error:', rpcError)
    return json({ error: rpcError.message }, rpcError.code === 'P0001' ? 400 : 500)
  }

  return json({ ok: true })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
