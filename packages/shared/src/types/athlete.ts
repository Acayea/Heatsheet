export type AthletePool = 'pro' | 'college'
export type AthleteGender = 'men' | 'women'

export type TrackEvent =
  | '60m'
  | '100m'
  | '200m'
  | '400m'
  | '800m'
  | '1500m'
  | '1mile'
  | '3000m'
  | '5000m'
  | '10000m'
  | '60m_hurdles'
  | '100m_hurdles'
  | '110m_hurdles'
  | '400m_hurdles'
  | '3000m_steeplechase'
  | '4x100m_relay'
  | '4x400m_relay'
  | 'high_jump'
  | 'pole_vault'
  | 'long_jump'
  | 'triple_jump'
  | 'shot_put'
  | 'discus'
  | 'hammer'
  | 'javelin'
  | 'heptathlon'
  | 'decathlon'
  | 'cross_country'
  | 'marathon'
  | '20km_walk'
  | '50km_walk'

export interface Athlete {
  id: string
  pool: AthletePool
  gender: AthleteGender
  firstName: string
  lastName: string
  countryCode: string // ISO 3166-1 alpha-3 for pro; school abbreviation for college
  primaryEvent: TrackEvent
  events: TrackEvent[]
  photoUrl: string | null
  worldAthleticsId: string | null // null until API contract is signed
  salary: number // fantasy salary cap value in credits
  isActive: boolean
  createdAt: string
  updatedAt: string
}
