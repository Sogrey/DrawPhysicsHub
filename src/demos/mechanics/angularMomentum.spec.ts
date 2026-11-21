import { describe, expect, it } from 'vitest'
import { createAngularMomentumModel, angularMomentumMeta } from './angularMomentum'
import { resolveTMax } from '@/core/physics/types'

describe('angular momentum about a point', () => {
  it('keeps L_z = −m v b constant', () => {
    const m = createAngularMomentumModel()
    m.init({ m: 1, v: 2, b: 1.5 })
    const expected = -1 * 2 * 1.5
    for (const ti of [0, 0.5, 1.2, 2.0, 3.5]) {
      m.seek?.(ti)
      const snap = m.observe()
      expect(Number(snap.values.Lz)).toBeCloseTo(expected, 5)
      expect(Number(snap.values.residual)).toBeCloseTo(0, 5)
      expect(Number(snap.values.Lmag)).toBeCloseTo(Math.abs(expected), 5)
    }
  })

  it('moves on the line y = b', () => {
    const m = createAngularMomentumModel()
    m.init({ m: 1, v: 1.5, b: 2 })
    m.seek?.(1)
    const snap = m.observe()
    expect(Number(snap.values.y)).toBeCloseTo(2, 5)
    expect(Number(snap.values.vx)).toBeCloseTo(1.5, 5)
  })

  it('uses tMax = 2 X / v', () => {
    const m = createAngularMomentumModel()
    m.init({ m: 1, v: 2, b: 1 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, angularMomentumMeta)).toBeCloseTo(5, 5)
  })
})
