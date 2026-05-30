/**
 * ingest-world-athletics
 *
 * Edge Function that ingests meet results from the World Athletics API
 * and writes scoring_events rows.
 *
 * Invocation:
 *   - Webhook (preferred): World Athletics pushes results to this endpoint
 *   - Cron fallback: poll every 15 minutes during active meets
 *
 * TODO: Replace stub with real World Athletics API client once
 * the API contract is signed and credentials are available.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { computePoints, PLACE_POINTS, MEET_TIER_MULTIPLIERS } from '../_shared/scoring.ts'

Deno.serve(async (req: Request) => {
  // Verify the request is from an authorized source
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('FUNCTION_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // In production: parse the World Athletics webhook payload
  // For now: return a stub indicating the function is wired up
  const body = await req.json().catch(() => ({}))
  console.log('[ingest-world-athletics] received payload:', JSON.stringify(body))

  // TODO: Implement once API contract is signed
  // const results = parseWorldAthleticsPayload(body)
  // await upsertScoringEvents(supabase, results)

  return new Response(
    JSON.stringify({ ok: true, message: 'stub — World Athletics API contract pending' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
