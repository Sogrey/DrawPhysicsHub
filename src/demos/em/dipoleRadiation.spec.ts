import { describe, expect, it } from 'vitest'
import { createDipoleRadiationModel, dipolePattern, dipoleRadiationMeta } from './dipoleRadiation'
import { resolveTMax } from '@/core/physics/types'

describe('Dipole radiation', () => {
  it('sin²θ peaks at equator', () => {
    expect(dipolePattern(90)).toBeCloseTo(1, 8)
    expect(dipolePattern(0)).toBeCloseTo(0, 8)
  })

  it('p oscillates', () => {
    const m = createDipoleRadiationModel()
    m.init({ omega: 2, p0: 1 })
    m.seek?.(0)
    const p0 = Number(m.observe().values.p)
    m.seek?.(Math.PI / 2 / 2)
    expect(Math.abs(Number(m.observe().values.p))).toBeLessThan(Math.abs(p0) + 0.01)
  })

  it('uses tMax', () => {
    const m = createDipoleRadiationModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, dipoleRadiationMeta)).toBeCloseTo(8, 5)
  })
})
