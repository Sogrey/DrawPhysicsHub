import { describe, expect, it } from 'vitest'
import { createNuclearDecayModel, decayLaw, halfLife, nuclearDecayMeta } from './nuclearDecay'
import { resolveTMax } from '@/core/physics/types'

describe('NuclearDecay', () => {
  it('halves at half-life', () => {
    const lam = 0.5
    const T = halfLife(lam)
    expect(decayLaw(100, lam, T)).toBeCloseTo(50, 5)
  })

  it('uses tMax', () => {
    const m = createNuclearDecayModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, nuclearDecayMeta)).toBeCloseTo(10, 5)
  })
})
