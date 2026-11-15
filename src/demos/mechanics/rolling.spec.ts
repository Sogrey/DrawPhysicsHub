import { describe, expect, it } from 'vitest'
import { createRollingModel, rollingMeta } from './rolling'
import { resolveTMax } from '@/core/physics/types'

describe('rolling without slipping', () => {
  it('enforces v = omega R', () => {
    const m = createRollingModel()
    m.init({ R: 1.2, v: 2.4, m: 1, kappa: 0.5 })
    const snap = m.observe()
    expect(Number(snap.values.omega)).toBeCloseTo(2, 5)
    expect(Number(snap.values.check)).toBeCloseTo(0, 10)
  })

  it('splits kinetic energy by kappa', () => {
    const m = createRollingModel()
    m.init({ R: 1, v: 2, m: 2, kappa: 0.5 })
    const snap = m.observe()
    const Ktr = 0.5 * 2 * 4
    const Krot = 0.5 * (0.5 * 2 * 1) * (2 * 2) // ½ I ω², ω=v/R=2
    expect(Number(snap.values.Ktr)).toBeCloseTo(Ktr, 5)
    expect(Number(snap.values.Krot)).toBeCloseTo(Krot, 5)
    expect(Number(snap.values.K)).toBeCloseTo(Ktr + Krot, 5)
    expect(Number(snap.values.Krot) / Number(snap.values.Ktr)).toBeCloseTo(0.5, 5)
  })

  it('rim starts at contact point', () => {
    const m = createRollingModel()
    m.init({ R: 1, v: 1, m: 1, kappa: 0.5 })
    const snap = m.observe()
    expect(Number(snap.values.rimX)).toBeCloseTo(0, 5)
    expect(Number(snap.values.rimY)).toBeCloseTo(0, 5)
  })

  it('uses tMax protocol', () => {
    const m = createRollingModel()
    m.init({ R: 1, v: 1.5, m: 1, kappa: 0.5 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, rollingMeta)).toBe(Number(live.tMax))
    expect(live.tMax).toBeGreaterThan(0)
  })
})
