export type FinishResult = 'completed' | 'dnf' | 'dns' | 'dq' | 'nh' | 'nm'

export interface ScoringEvent {
  id: string
  meetId: string
  athleteId: string
  event: string // TrackEvent value
  place: number | null // null for DNF/DNS/DQ/NH/NM
  result: FinishResult
  mark: string | null // e.g. "9.85", "2.35m", "8500pts"
  basePoints: number // position-based points (1-20 scale)
  tierMultiplier: number // meet tier bonus multiplier
  totalPoints: number // basePoints * tierMultiplier
  dnfInsuranceApplied: boolean
  createdAt: string
}

// Points awarded by finish place (1st = 20, 20th = 1, unplaced = -2)
export const PLACE_POINTS: Record<number, number> = {
  1: 20,
  2: 18,
  3: 16,
  4: 14,
  5: 12,
  6: 10,
  7: 9,
  8: 8,
  9: 7,
  10: 6,
  11: 5,
  12: 4,
  13: 3,
  14: 3,
  15: 2,
  16: 2,
  17: 1,
  18: 1,
  19: 1,
  20: 1,
} as const

export const DNF_PENALTY = -2
export const CAPTAIN_MULTIPLIER = 2

export type MeetTierMultiplier = {
  world_championship: 3
  diamond_league: 2
  gold: 1.5
  silver: 1.25
  bronze: 1.1
  regular: 1
}

export const MEET_TIER_MULTIPLIERS: Record<keyof MeetTierMultiplier, number> = {
  world_championship: 3,
  diamond_league: 2,
  gold: 1.5,
  silver: 1.25,
  bronze: 1.1,
  regular: 1,
} as const
