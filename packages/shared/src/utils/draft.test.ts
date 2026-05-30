import { describe, it, expect } from 'vitest'
import { snakePickerIndex, computeRosterPoints } from './draft'

describe('snakePickerIndex', () => {
  it('round 1 goes 1→N (ascending)', () => {
    expect(snakePickerIndex(1, 4)).toBe(1)
    expect(snakePickerIndex(2, 4)).toBe(2)
    expect(snakePickerIndex(3, 4)).toBe(3)
    expect(snakePickerIndex(4, 4)).toBe(4)
  })

  it('round 2 goes N→1 (descending)', () => {
    expect(snakePickerIndex(5, 4)).toBe(4)
    expect(snakePickerIndex(6, 4)).toBe(3)
    expect(snakePickerIndex(7, 4)).toBe(2)
    expect(snakePickerIndex(8, 4)).toBe(1)
  })

  it('round 3 goes 1→N again', () => {
    expect(snakePickerIndex(9, 4)).toBe(1)
    expect(snakePickerIndex(12, 4)).toBe(4)
  })

  it('works for 2-member league', () => {
    expect(snakePickerIndex(1, 2)).toBe(1)
    expect(snakePickerIndex(2, 2)).toBe(2)
    expect(snakePickerIndex(3, 2)).toBe(2)
    expect(snakePickerIndex(4, 2)).toBe(1)
  })
})

describe('computeRosterPoints', () => {
  const athlete1 = { athleteId: 'a1', slotType: 'captain' as const }
  const athlete2 = { athleteId: 'a2', slotType: 'starter' as const }
  const athlete3 = { athleteId: 'a3', slotType: 'bench' as const }
  const pointsMap = new Map([['a1', 20], ['a2', 10], ['a3', 5]])

  it('doubles captain points', () => {
    const result = computeRosterPoints([athlete1], pointsMap)
    expect(result).toBe(40)
  })

  it('counts starters at 1x', () => {
    const result = computeRosterPoints([athlete2], pointsMap)
    expect(result).toBe(10)
  })

  it('ignores bench', () => {
    const result = computeRosterPoints([athlete3], pointsMap)
    expect(result).toBe(0)
  })

  it('sums mixed roster correctly', () => {
    const result = computeRosterPoints([athlete1, athlete2, athlete3], pointsMap)
    expect(result).toBe(50)
  })

  it('handles athletes not in points map (0 points)', () => {
    const result = computeRosterPoints([{ athleteId: 'unknown', slotType: 'starter' }], pointsMap)
    expect(result).toBe(0)
  })
})
