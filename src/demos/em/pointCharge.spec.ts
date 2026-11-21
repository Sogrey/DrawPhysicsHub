import { describe, expect, it } from 'vitest'
import { createPointChargeModel, pointChargeMeta } from './pointCharge'
import { resolveTMax } from '@/core/physics/types'

describe('point charge field superposition', () => {
  it('cancels at midpoint for equal like charges', () => {
    const m = createPointChargeModel()
    m.init({ Q1: 1.5, Q2: 1.5, d: 2.4, R: 2 })
    const snap = m.observe()
    expect(Number(snap.values.Emag0)).toBeCloseTo(0, 5)
  })

  it('adds at midpoint for equal opposite charges', () => {
    const m = createPointChargeModel()
    m.init({ Q1: 2, Q2: -2, d: 2.4, R: 2 })
    const snap = m.observe()
    // each |E| = 2 / 1.2^2 ≈ 1.389, same direction → ≈ 2.778
    expect(Number(snap.values.Emag0)).toBeCloseTo(2 / (1.2 * 1.2) * 2, 3)
    expect(Number(snap.values.Ey0)).toBeCloseTo(0, 5)
  })

  it('samples a field vector grid', () => {
    const m = createPointChargeModel()
    m.init({ Q1: 1, Q2: -1, d: 2, R: 2 })
    const snap = m.observe()
    const v = snap.values.fieldVectors
    expect(v instanceof Float32Array).toBe(true)
    expect((v as Float32Array).length).toBe(
      Number(snap.values.nx) * Number(snap.values.ny) * 2,
    )
  })

  it('uses tMax protocol', () => {
    const m = createPointChargeModel()
    m.init({ Q1: 1, Q2: -1, d: 2, R: 2 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, val] of Object.entries(snap.values)) {
      if (typeof val === 'number') live[k] = val
    }
    expect(resolveTMax(live, pointChargeMeta)).toBeCloseTo(6, 5)
  })
})
