import { describe, it, expect } from 'vitest'
import { PLACE_POINTS, MEET_TIER_MULTIPLIERS } from '../types/scoring'

describe('PLACE_POINTS', () => {
  it('awards 20 points for 1st', () => {
    expect(PLACE_POINTS[1]).toBe(20)
  })

  it('awards 1 point for 20th', () => {
    expect(PLACE_POINTS[20]).toBe(1)
  })
})

describe('MEET_TIER_MULTIPLIERS', () => {
  it('world championship is 3x', () => {
    expect(MEET_TIER_MULTIPLIERS.world_championship).toBe(3)
  })

  it('regular meet is 1x', () => {
    expect(MEET_TIER_MULTIPLIERS.regular).toBe(1)
  })
})
