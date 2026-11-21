import { describe, expect, it } from 'vitest'
import { createDipoleModel, dipoleMeta } from './dipole'
import { resolveTMax } from '@/core/physics/types'

describe('electric dipole field', () => {
  it('approaches ideal axial / equatorial magnitudes for small a', () => {
    const m = createDipoleModel()
    const p = 2.4
    const R = 2.8
    m.init({ p, a: 0.25, R })
    const snap = m.observe()
    const idealAx = (2 * p) / R ** 3
    const idealEq = p / R ** 3
    expect(Number(snap.values.EmagAx)).toBeCloseTo(idealAx, 1)
    expect(Number(snap.values.EmagEq)).toBeCloseTo(idealEq, 1)
    expect(Number(snap.values.EmagAx) / Number(snap.values.EmagEq)).toBeCloseTo(2, 1)
  })

  it('ratio → 1 as a shrinks at fixed probe (axis)', () => {
    const m = createDipoleModel()
    m.init({ p: 2.4, a: 0.3, R: 2.8 })
    // seek to θ=0 (t=0 → probe at (R,0))
    m.seek?.(0)
    const snap = m.observe()
    expect(Number(snap.values.ratio)).toBeGreaterThan(0.88)
    expect(Number(snap.values.ratio)).toBeLessThan(1.12)
  })

  it('keeps p = Q a', () => {
    const m = createDipoleModel()
    m.init({ p: 2.4, a: 0.8, R: 2.5 })
    const snap = m.observe()
    expect(Number(snap.values.Q) * Number(snap.values.a)).toBeCloseTo(2.4, 5)
  })

  it('uses tMax protocol', () => {
    const m = createDipoleModel()
    m.init({ p: 2.4, a: 1.2, R: 2.8 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, val] of Object.entries(snap.values)) {
      if (typeof val === 'number') live[k] = val
    }
    expect(resolveTMax(live, dipoleMeta)).toBeCloseTo(6, 5)
  })
})
