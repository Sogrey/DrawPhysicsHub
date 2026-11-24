import { describe, expect, it } from 'vitest'
import {
  createPhysicalPendulumModel,
  physicalPendulumMeta,
  physicalPeriod,
} from './physicalPendulum'
import { resolveTMax } from '@/core/physics/types'

describe('Physical pendulum', () => {
  it('period positive', () => {
    expect(physicalPeriod(2, 1, 0.5)).toBeGreaterThan(1)
  })

  it('uses tMax', () => {
    const m = createPhysicalPendulumModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, physicalPendulumMeta)).toBeCloseTo(10, 5)
  })
})
