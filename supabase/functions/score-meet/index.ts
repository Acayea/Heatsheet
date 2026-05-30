/**
 * score-meet
 *
 * Computes fantasy points for all rosters in the meet's season after
 * scoring_events have been inserted for the meet. Idempotent: re-invoking
 * with force=false on an already-scored meet returns a 409.
 *
 * Auth: Bearer FUNCTION_SECRET header
 * Body: { meetId: string, force?: boolean }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.101.1'

const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET')

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader || authHeader !== `Bearer ${FUNCTION_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  let meetId: string
  let force: boolean
  try {
    const body = await req.json()
    meetId = body.meetId
    force = body.force === true
    if (!meetId || typeof meetId !== 'string') throw new Error('meetId required')
  } catch (e) {
    return json({ error: String(e) }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Load meet + season_id in one query
  const { data: meet, error: meetError } = await supabase
    .from('meets')
    .select('id, season_id, is_scored, scored_at')
    .eq('id', meetId)
    .single()

  if (meetError || !meet) return json({ error: 'Meet not found' }, 404)

  if (meet.is_scored && !force) {
    return json({ error: 'Meet already scored. Pass force=true to re-score.' }, 409)
  }

  // Aggregate raw points per athlete for this meet
  const { data: events, error: eventsError } = await supabase
    .from('scoring_events')
    .select('athlete_id, total_points')
    .eq('meet_id', meetId)

  if (eventsError) {
    console.error('[score-meet] scoring_events query failed:', eventsError)
    return json({ error: eventsError.message }, 500)
  }

  if (!events?.length) {
    return json({ error: 'No scoring events for this meet' }, 422)
  }

  const athletePoints = new Map<string, number>()
  for (const ev of events) {
    athletePoints.set(ev.athlete_id, (athletePoints.get(ev.athlete_id) ?? 0) + Number(ev.total_points))
  }

  // Load rosters scoped to this meet's season via leagues.season_id
  const { data: rosters, error: rostersError } = await supabase
    .from('rosters')
    .select('id, user_id, league_id, leagues!inner(season_id)')
    .eq('leagues.season_id', meet.season_id)

  if (rostersError) {
    console.error('[score-meet] rosters query failed:', rostersError)
    return json({ error: rostersError.message }, 500)
  }

  if (!rosters?.length) {
    return json({ ok: true, message: 'No rosters in this season', rostersScored: 0 })
  }

  let rostersScored = 0
  for (const roster of rosters) {
    const { data: slots } = await supabase
      .from('roster_athletes')
      .select('athlete_id, slot_type')
      .eq('roster_id', roster.id)

    if (!slots?.length) continue

    let points = 0
    for (const slot of slots) {
      if (slot.slot_type === 'bench') continue
      const pts = athletePoints.get(slot.athlete_id) ?? 0
      points += slot.slot_type === 'captain' ? pts * 2 : pts
    }

    if (points > 0) {
      const { error: rpcError } = await supabase.rpc('add_member_points', {
        p_league_id: roster.league_id,
        p_user_id: roster.user_id,
        p_points: points,
      })
      if (rpcError) {
        console.error(`[score-meet] add_member_points failed for roster ${roster.id}:`, rpcError)
      }
    }
    rostersScored++
  }

  // Mark meet as scored
  const { error: updateError } = await supabase
    .from('meets')
    .update({ is_scored: true, scored_at: new Date().toISOString() })
    .eq('id', meetId)

  if (updateError) {
    console.error('[score-meet] failed to mark meet as scored:', updateError)
  }

  return json({ ok: true, meetId, rostersScored })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
