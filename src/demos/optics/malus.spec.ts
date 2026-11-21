import { describe, expect, it } from 'vitest'
import { createMalusModel, malusMeta } from './malus'
import { resolveTMax } from '@/core/physics/types'

describe('Malus law', () => {
  it('gives I1 = I0/2 and I2 = I1 at θ=0', () => {
    const m = createMalusModel()
    m.init({ I0: 1, thetaP: 0 })
    m.seek?.(0)
    const snap = m.observe()
    expect(Number(snap.values.I1)).toBeCloseTo(0.5, 5)
    expect(Number(snap.values.theta)).toBeCloseTo(0, 5)
    expect(Number(snap.values.I2)).toBeCloseTo(0.5, 5)
  })

  it('extinguishes at θ=90°', () => {
    const m = createMalusModel()
    m.init({ I0: 1, thetaP: 0 })
    // T=6 → θ_A = 360*t/6; want 90° → t = 6*90/360 = 1.5
    m.seek?.(1.5)
    const snap = m.observe()
    expect(Number(snap.values.thetaA)).toBeCloseTo(90, 5)
    expect(Number(snap.values.I2)).toBeCloseTo(0, 5)
    expect(Number(snap.values.cos2)).toBeCloseTo(0, 5)
  })

  it('follows cos² for mid angle', () => {
    const m = createMalusModel()
    m.init({ I0: 1, thetaP: 0 })
    m.seek?.(0.75) // θ_A = 45°
    const snap = m.observe()
    expect(Number(snap.values.theta)).toBeCloseTo(45, 5)
    expect(Number(snap.values.I2)).toBeCloseTo(0.5 * 0.5, 4)
  })

  it('uses tMax protocol', () => {
    const m = createMalusModel()
    m.init({ I0: 1, thetaP: 0 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, malusMeta)).toBeCloseTo(6, 5)
  })
})
