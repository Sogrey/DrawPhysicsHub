import { describe, expect, it } from 'vitest'
import { createCyclotronModel, cyclotronMeta } from './cyclotron'
import { resolveTMax } from '@/core/physics/types'

describe('lorentz cyclotron', () => {
  it('gives R = m v / (|q| B)', () => {
    const m = createCyclotronModel()
    m.init({ q: 1, m: 1, v: 2, B: 1 })
    expect(Number(m.observe().values.R)).toBeCloseTo(2, 5)
  })

  it('keeps |v| constant and F ⟂ v', () => {
    const m = createCyclotronModel()
    m.init({ q: 1, m: 1, v: 2, B: 1 })
    m.seek?.(0.5)
    const snap = m.observe()
    expect(Number(snap.values.speed)).toBeCloseTo(2, 4)
    const vx = Number(snap.values.vx)
    const vy = Number(snap.values.vy)
    const Fx = Number(snap.values.Fx)
    const Fy = Number(snap.values.Fy)
    expect(vx * Fx + vy * Fy).toBeCloseTo(0, 4)
  })

  it('flips sense when q flips (B>0)', () => {
    const a = createCyclotronModel()
    a.init({ q: 1, m: 1, v: 2, B: 1 })
    expect(Number(a.observe().values.sense)).toBe(-1) // CW

    const b = createCyclotronModel()
    b.init({ q: -1, m: 1, v: 2, B: 1 })
    expect(Number(b.observe().values.sense)).toBe(1) // CCW
    expect(Number(b.observe().values.R)).toBeCloseTo(2, 5)
  })

  it('uses tMax = period', () => {
    const m = createCyclotronModel()
    m.init({ q: 1, m: 1, v: 2, B: 1 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, val] of Object.entries(snap.values)) {
      if (typeof val === 'number') live[k] = val
    }
    // T = 2π m / (|q|B) = 2π
    expect(resolveTMax(live, cyclotronMeta)).toBeCloseTo(2 * Math.PI, 5)
  })
})
