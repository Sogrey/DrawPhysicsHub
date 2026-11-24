import { describe, expect, it } from 'vitest'
import { createVariationalModel, variationalEnergy, variationalMeta } from './variational'
import { resolveTMax } from '@/core/physics/types'

describe('Variational', () => {
  it('minimum at alpha=1 equals 0.5', () => {
    expect(variationalEnergy(1)).toBeCloseTo(0.5, 8)
    expect(variationalEnergy(0.5)).toBeGreaterThan(0.5)
    expect(variationalEnergy(2)).toBeGreaterThan(0.5)
  })

  it('uses tMax', () => {
    const m = createVariationalModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, variationalMeta)).toBeCloseTo(8, 5)
  })
})
