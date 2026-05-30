/**
 * make-draft-pick
 *
 * Validates and records a snake draft pick.
 * Called by the draft room client when a user selects an athlete.
 *
 * Validates:
 *  - League is in active draft
 *  - It is the caller's turn (snake order)
 *  - Athlete is not already picked
 *  - Pick does not exceed the caller's salary cap
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PickRequest {
  leagueId: string
  athleteId: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Auth: get calling user from JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !user) return new Response('Unauthorized', { status: 401 })

  const { leagueId, athleteId }: PickRequest = await req.json()
  if (!leagueId || !athleteId) {
    return json({ error: 'leagueId and athleteId are required' }, 400)
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(leagueId) || !UUID_RE.test(athleteId)) {
    return json({ error: 'leagueId and athleteId must be valid UUIDs' }, 400)
  }

  // Use service role for all DB writes
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1. Load league
  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .select('*, league_members(user_id, draft_order, total_points)')
    .eq('id', leagueId)
    .single()

  if (leagueError || !league) return json({ error: 'League not found' }, 404)
  if (league.draft_status !== 'active') return json({ error: 'Draft is not active' }, 400)

  const members: { user_id: string; draft_order: number }[] = league.league_members
  const numMembers = members.length

  // 2. Load existing picks to determine current pick number
  const { data: picks } = await supabase
    .from('draft_picks')
    .select('pick_number, user_id, athlete_id')
    .eq('league_id', leagueId)
    .order('pick_number')

  const existingPicks = picks ?? []
  const currentPickNumber = existingPicks.length + 1
  const round = Math.ceil(currentPickNumber / numMembers)
  const positionInRound = ((currentPickNumber - 1) % numMembers) + 1

  // Snake: odd rounds go 1→N, even rounds go N→1
  const draftPosition = round % 2 === 1 ? positionInRound : numMembers - positionInRound + 1
  const currentPicker = members.find((m) => m.draft_order === draftPosition)

  if (!currentPicker || currentPicker.user_id !== user.id) {
    return json({ error: 'It is not your turn' }, 403)
  }

  // 3. Athlete not already picked
  const alreadyPicked = existingPicks.some((p) => p.athlete_id === athleteId)
  if (alreadyPicked) return json({ error: 'Athlete already drafted' }, 409)

  // 4. Load athlete salary
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, salary, first_name, last_name')
    .eq('id', athleteId)
    .single()

  if (!athlete) return json({ error: 'Athlete not found' }, 404)

  // 5. Check salary cap for this user
  const season = await supabase
    .from('seasons')
    .select('salary_cap, roster_size')
    .eq('id', league.season_id)
    .single()

  const salaryCap = season.data?.salary_cap ?? 50000
  const rosterSize = season.data?.roster_size ?? 8

  // Load roster from draft_picks for this user
  const { data: myPicks } = await supabase
    .from('draft_picks')
    .select('salary')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)

  const salaryUsed = (myPicks ?? []).reduce((sum, p) => sum + p.salary, 0)
  const remainingPicks = rosterSize - (myPicks?.length ?? 0) - 1 // -1 for this pick
  const minRemainingCost = remainingPicks * 1000 // rough floor assuming cheapest possible picks

  if (salaryUsed + athlete.salary + minRemainingCost > salaryCap) {
    return json({ error: 'Insufficient salary cap' }, 422)
  }

  // 6. Record the pick
  const { error: pickError } = await supabase.from('draft_picks').insert({
    league_id: leagueId,
    user_id: user.id,
    athlete_id: athleteId,
    pick_number: currentPickNumber,
    round_number: round,
    salary: athlete.salary,
  })

  if (pickError) {
    console.error('[make-draft-pick] insert error:', pickError)
    // Unique constraint on (league_id, pick_number) means another pick landed first
    if (pickError.code === '23505') {
      return json({ error: 'It is not your turn — someone just picked ahead of you' }, 409)
    }
    return json({ error: 'Failed to record pick' }, 500)
  }

  // 7. Also write to roster_athletes
  const { data: roster } = await supabase
    .from('rosters')
    .select('id')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .single()

  if (roster) {
    const myPickCount = (myPicks?.length ?? 0) + 1
    const slotType = myPickCount === 1 ? 'captain' : myPickCount <= 6 ? 'starter' : 'bench'

    await supabase.from('roster_athletes').insert({
      roster_id: roster.id,
      athlete_id: athleteId,
      slot_type: slotType,
    })

    await supabase
      .from('rosters')
      .update({ total_salary_used: salaryUsed + athlete.salary })
      .eq('id', roster.id)
  }

  // 8. Check if draft is complete
  const totalPicks = numMembers * rosterSize
  if (currentPickNumber >= totalPicks) {
    await supabase
      .from('leagues')
      .update({ draft_status: 'completed' })
      .eq('id', leagueId)
  }

  return json({
    ok: true,
    pick: {
      pickNumber: currentPickNumber,
      round,
      athleteId,
      athleteName: `${athlete.first_name} ${athlete.last_name}`,
      salary: athlete.salary,
    },
  })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
