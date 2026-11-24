import { describe, expect, it } from 'vitest'
import { createMinkowskiModel, lorentzGamma, minkowskiMeta, simultaneityGap } from './minkowski'
import { resolveTMax } from '@/core/physics/types'

describe('Minkowski', () => {
  it('gamma at rest is 1', () => {
    expect(lorentzGamma(0)).toBeCloseTo(1, 8)
  })

  it('gamma grows with beta', () => {
    expect(lorentzGamma(0.6)).toBeGreaterThan(1.2)
    expect(lorentzGamma(0.8)).toBeGreaterThan(lorentzGamma(0.6))
  })

  it('simultaneity gap vanishes at beta=0', () => {
    expect(simultaneityGap(0, 2)).toBeCloseTo(0, 8)
  })

  it('uses tMax', () => {
    const m = createMinkowskiModel()
    m.init({ beta: 0.5 })
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, minkowskiMeta)).toBeCloseTo(8, 5)
    expect(live.gamma!).toBeCloseTo(lorentzGamma(0.5), 5)
  })
})
