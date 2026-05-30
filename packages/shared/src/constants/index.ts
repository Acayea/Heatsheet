export const SALARY_CAP = 50_000 // credits per roster

export const ROSTER_SIZE = 8 // total athletes
export const STARTING_SLOTS = 6 // starters (including captain)
export const BENCH_SLOTS = 2

export const DNF_INSURANCE_TOKENS_PER_SEASON = 1

export const INVITE_CODE_LENGTH = 8

export const MAX_LEAGUE_MEMBERS = 20
export const MIN_LEAGUE_MEMBERS = 2
export const DEFAULT_LEAGUE_MEMBERS = 10

export const PICKEM_CORRECT_POINTS = 5
export const PICKEM_INCORRECT_POINTS = 0

export const SEASONS = {
  PRO_INDOOR: 'pro_indoor',
  COLLEGE_INDOOR: 'college_indoor',
  PRO_OUTDOOR: 'pro_outdoor',
  COLLEGE_OUTDOOR: 'college_outdoor',
  PRO_CROSS_COUNTRY: 'pro_cross_country',
  COLLEGE_CROSS_COUNTRY: 'college_cross_country',
} as const
