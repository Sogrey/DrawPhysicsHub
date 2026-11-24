import { describe, expect, it } from 'vitest'
import { createHallModel, hallMeta, hallVoltage } from './hall'
import { resolveTMax } from '@/core/physics/types'

describe('Hall', () => {
  it('VH scales with I B / n', () => {
    expect(hallVoltage(2, 1, 1)).toBeCloseTo(2, 6)
    expect(hallVoltage(1, 1, 2)).toBeCloseTo(0.5, 6)
  })

  it('uses tMax', () => {
    const m = createHallModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, hallMeta)).toBeCloseTo(8, 5)
  })
})
