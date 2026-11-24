import { describe, expect, it } from 'vitest'
import { createTennisRacketModel, intermediateGrowth, tennisRacketMeta } from './tennisRacket'
import { resolveTMax } from '@/core/physics/types'

describe('TennisRacket', () => {
  it('perturbation grows on intermediate axis', () => {
    expect(intermediateGrowth(0.1, 2, 0.7)).toBeGreaterThan(0.1)
  })

  it('uses tMax', () => {
    const m = createTennisRacketModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, tennisRacketMeta)).toBeCloseTo(8, 5)
  })
})
