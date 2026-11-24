import { describe, expect, it } from 'vitest'
import { bernoulliDeltaP, bernoulliMeta, continuitySpeed, createBernoulliModel } from './bernoulli'
import { resolveTMax } from '@/core/physics/types'

describe('Bernoulli', () => {
  it('continuity doubles speed when area halves', () => {
    expect(continuitySpeed(2, 1, 1)).toBeCloseTo(2, 8)
  })

  it('faster stream has lower pressure', () => {
    expect(bernoulliDeltaP(1, 1, 2)).toBeLessThan(0)
  })

  it('uses tMax', () => {
    const m = createBernoulliModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, bernoulliMeta)).toBeCloseTo(8, 5)
  })
})
