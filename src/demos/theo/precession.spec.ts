import { describe, expect, it } from 'vitest'
import { createPrecessionModel, precessionMeta, precessionRate } from './precession'
import { resolveTMax } from '@/core/physics/types'

describe('Precession', () => {
  it('Ωp ∝ 1/ω3', () => {
    const a = precessionRate(1, 1, 1.2, 1, 12)
    const b = precessionRate(1, 1, 1.2, 1, 24)
    expect(b).toBeCloseTo(a / 2, 5)
  })

  it('axis tip moves in azimuth', () => {
    const m = createPrecessionModel()
    m.init({ omega3: 12, tilt: 25, Mh: 1.2, I3: 1 })
    const p0 = Number(m.observe().values.phi)
    m.seek?.(2)
    expect(Math.abs(Number(m.observe().values.phi) - p0)).toBeGreaterThan(1)
  })

  it('uses tMax', () => {
    const m = createPrecessionModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, precessionMeta)).toBeCloseTo(10, 5)
  })
})
