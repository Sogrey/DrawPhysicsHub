import { describe, expect, it } from 'vitest'
import { createEnergyCurveModel, energyCurveMeta } from './energyCurve'
import { resolveTMax } from '@/core/physics/types'

describe('energy curve (SHO)', () => {
  it('conserves E = K + U', () => {
    const m = createEnergyCurveModel()
    m.init({ m: 1, k: 4, A: 1.5 })
    for (const ti of [0, 0.2, 0.5, 1.0, 1.4]) {
      m.seek?.(ti)
      const snap = m.observe()
      expect(Number(snap.values.residual)).toBeCloseTo(0, 5)
      expect(Number(snap.values.K) + Number(snap.values.U)).toBeCloseTo(
        Number(snap.values.E),
        5,
      )
    }
  })

  it('has E = ½ k A² and turning points ±A', () => {
    const m = createEnergyCurveModel()
    m.init({ m: 1, k: 4, A: 1 })
    const snap = m.observe()
    expect(Number(snap.values.E)).toBeCloseTo(2, 5)
    expect(Number(snap.values.turning)).toBeCloseTo(1, 5)
    m.seek?.(0)
    expect(Number(m.observe().values.x)).toBeCloseTo(1, 5)
    expect(Number(m.observe().values.K)).toBeCloseTo(0, 5)
  })

  it('uses ω = √(k/m) period', () => {
    const m = createEnergyCurveModel()
    m.init({ m: 1, k: 4, A: 1 })
    const snap = m.observe()
    expect(Number(snap.values.omega)).toBeCloseTo(2, 5)
    expect(Number(snap.values.period)).toBeCloseTo(Math.PI, 5)
  })

  it('uses tMax protocol', () => {
    const m = createEnergyCurveModel()
    m.init({ m: 1, k: 4, A: 1.2 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [key, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[key] = v
    }
    expect(resolveTMax(live, energyCurveMeta)).toBeCloseTo(Math.PI, 5)
  })
})
