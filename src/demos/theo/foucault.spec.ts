import { describe, expect, it } from 'vitest'
import { createFoucaultModel, foucaultMeta, foucaultRate } from './foucault'
import { resolveTMax } from '@/core/physics/types'

describe('Foucault', () => {
  it('Ωf = Ω sinλ', () => {
    expect(foucaultRate(0.4, 90)).toBeCloseTo(0.4, 8)
    expect(foucaultRate(0.4, 0)).toBeCloseTo(0, 8)
  })

  it('plane angle advances at mid latitude', () => {
    const m = createFoucaultModel()
    m.init({ lat: 45, OmegaE: 0.35, L: 2, amp: 18 })
    m.seek?.(4)
    expect(Math.abs(Number(m.observe().values.alphaDeg))).toBeGreaterThan(5)
  })

  it('uses tMax', () => {
    const m = createFoucaultModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, foucaultMeta)).toBeCloseTo(16, 5)
  })
})
