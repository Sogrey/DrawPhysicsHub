import { describe, expect, it } from 'vitest'
import {
  createMotionalEmfModel,
  motionalEmfMeta,
  motionalState,
} from './motionalEmf'
import { resolveTMax } from '@/core/physics/types'

describe('motional EMF', () => {
  it('gives ε = B L v', () => {
    const s = motionalState(1.2, 2, 2, 0.8, 1)
    expect(s.emf).toBeCloseTo(1.2 * 2 * 0.8, 5)
    expect(s.Phi).toBeCloseTo(1.2 * 2 * 2, 5)
    expect(s.I).toBeCloseTo(s.emf, 5)
  })

  it('damps with Fx = -B² L² v / R', () => {
    const B = 1.2
    const L = 2
    const v = 0.8
    const R = 1
    const s = motionalState(B, L, 2, v, R)
    expect(s.Fx).toBeCloseTo(-(B * B * L * L * v) / R, 5)
  })

  it('sweeps x and uses tMax', () => {
    const m = createMotionalEmfModel()
    m.init({ B: 1.2, L: 2, v: 0.8, R: 1, xMax: 4 })
    m.seek?.(0)
    const a = Number(m.observe().values.x)
    m.seek?.(100)
    const b = Number(m.observe().values.x)
    expect(b).toBeGreaterThan(a)
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, motionalEmfMeta)).toBeGreaterThan(1)
  })
})
