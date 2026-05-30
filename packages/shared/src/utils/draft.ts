import { CAPTAIN_MULTIPLIER } from '../types/scoring'

export function snakePickerIndex(pickNumber: number, numMembers: number): number {
  const round = Math.ceil(pickNumber / numMembers)
  const posInRound = ((pickNumber - 1) % numMembers) + 1
  return round % 2 === 1 ? posInRound : numMembers - posInRound + 1
}

export interface RosterSlot {
  athleteId: string
  slotType: 'captain' | 'starter' | 'bench'
}

export function computeRosterPoints(
  slots: RosterSlot[],
  athletePoints: Map<string, number>,
): number {
  let total = 0
  for (const slot of slots) {
    if (slot.slotType === 'bench') continue
    const pts = athletePoints.get(slot.athleteId) ?? 0
    total += slot.slotType === 'captain' ? pts * CAPTAIN_MULTIPLIER : pts
  }
  return total
}
