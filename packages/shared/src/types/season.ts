export type SeasonLevel = 'pro' | 'college'
export type SeasonDiscipline = 'indoor' | 'outdoor' | 'cross_country'
export type SeasonStatus = 'upcoming' | 'active' | 'completed'

export interface Season {
  id: string
  level: SeasonLevel
  discipline: SeasonDiscipline
  name: string // e.g. "2025 Pro Indoor"
  status: SeasonStatus
  draftOpensAt: string
  startsAt: string
  endsAt: string
  salaryCap: number
  rosterSize: number // total athletes per roster
  startingSlots: number // starters vs bench
  createdAt: string
}

export type MeetTier = 'world_championship' | 'diamond_league' | 'gold' | 'silver' | 'bronze' | 'regular'

export interface Meet {
  id: string
  seasonId: string
  name: string
  location: string
  tier: MeetTier
  startsAt: string
  endsAt: string
  isScored: boolean // true once results have been processed
  createdAt: string
}
