// Scoring constants shared across edge functions.
// Must stay in sync with packages/shared/src/types/scoring.ts — same values.

export const PLACE_POINTS: Record<number, number> = {
  1: 20, 2: 18, 3: 16, 4: 14, 5: 12,
  6: 10, 7: 9,  8: 8,  9: 7,  10: 6,
  11: 5, 12: 4, 13: 3, 14: 3, 15: 2,
  16: 2, 17: 1, 18: 1, 19: 1, 20: 1,
} as const

export const DNF_PENALTY = -2
export const CAPTAIN_MULTIPLIER = 2

export const MEET_TIER_MULTIPLIERS: Record<string, number> = {
  world_championship: 3,
  diamond_league: 2,
  gold: 1.5,
  silver: 1.25,
  bronze: 1.1,
  regular: 1,
} as const

export function computePoints(place: number | null, tier: string): number {
  if (place === null) return DNF_PENALTY
  const base = PLACE_POINTS[place] ?? 0
  const multiplier = MEET_TIER_MULTIPLIERS[tier] ?? 1
  return base * multiplier
}
