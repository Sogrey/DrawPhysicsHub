import { describe, expect, it } from 'vitest'
import { beadR, createLagrangeBeadModel, lagrangeBeadMeta } from './lagrangeBead'
import { resolveTMax } from '@/core/physics/types'

describe('Lagrange bead', () => {
  it('grows as cosh for v0=0', () => {
    const s0 = beadR(1, 0.5, 0, 0)
    const s1 = beadR(1, 0.5, 0, 1)
    expect(s0.r).toBeCloseTo(0.5, 5)
    expect(s1.r).toBeGreaterThan(s0.r)
    expect(s1.r).toBeCloseTo(0.5 * Math.cosh(1), 5)
  })

  it('model r increases', () => {
    const m = createLagrangeBeadModel()
    m.init({ Omega: 1.1, r0: 0.5, v0: 0 })
    const r0 = Number(m.observe().values.r)
    m.seek?.(1.2)
    expect(Number(m.observe().values.r)).toBeGreaterThan(r0 + 0.2)
  })

  it('uses tMax', () => {
    const m = createLagrangeBeadModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, lagrangeBeadMeta)).toBeCloseTo(5, 5)
  })
})
