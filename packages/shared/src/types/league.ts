export type LeagueType = 'public' | 'private'
export type LeagueMemberRole = 'commissioner' | 'member'
export type DraftStatus = 'pending' | 'active' | 'completed'

export interface League {
  id: string
  seasonId: string
  name: string
  type: LeagueType
  inviteCode: string | null // only for private leagues
  maxMembers: number
  draftStatus: DraftStatus
  draftStartsAt: string | null
  createdBy: string
  createdAt: string
}

export interface LeagueMember {
  id: string
  leagueId: string
  userId: string
  role: LeagueMemberRole
  draftOrder: number | null
  totalPoints: number
  joinedAt: string
}

export type RosterSlotType = 'starter' | 'bench' | 'captain'

export interface Roster {
  id: string
  leagueId: string
  userId: string
  seasonId: string
  totalSalaryUsed: number
  createdAt: string
  updatedAt: string
}

export interface RosterAthlete {
  id: string
  rosterId: string
  athleteId: string
  slotType: RosterSlotType
  acquiredAt: string
  droppedAt: string | null
}
