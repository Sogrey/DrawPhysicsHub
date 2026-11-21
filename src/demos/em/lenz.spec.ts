import { describe, expect, it } from 'vitest'
import { createLenzModel, lenzMeta } from './lenz'
import { resolveTMax } from '@/core/physics/types'

describe('flux / Lenz law', () => {
  it('gives Φ = B A and ε = −A dB/dt', () => {
    const m = createLenzModel()
    m.init({ A: 4, Bamp: 1.2, R: 1, omega: 1 })
    m.seek?.(0)
    const snap = m.observe()
    // B(0)=0, dB/dt = Bamp*ω = 1.2, ε = -4*1.2 = -4.8
    expect(Number(snap.values.B)).toBeCloseTo(0, 5)
    expect(Number(snap.values.Phi)).toBeCloseTo(0, 5)
    expect(Number(snap.values.emf)).toBeCloseTo(-4.8, 4)
    expect(Number(snap.values.I)).toBeCloseTo(-4.8, 4)
  })

  it('uses clockwise sense when B out-of-page is increasing', () => {
    const m = createLenzModel()
    m.init({ A: 4, Bamp: 1.2, R: 1, omega: 1 })
    m.seek?.(0.1)
    const snap = m.observe()
    expect(Number(snap.values.B)).toBeGreaterThan(0)
    expect(Number(snap.values.dBdt)).toBeGreaterThan(0)
    expect(Number(snap.values.sense)).toBe(-1)
  })

  it('scales |ε| with A and ω', () => {
    const m = createLenzModel()
    m.init({ A: 2, Bamp: 1, R: 1, omega: 2 })
    m.seek?.(0)
    expect(Math.abs(Number(m.observe().values.emf))).toBeCloseTo(4, 4)
  })

  it('uses tMax protocol', () => {
    const m = createLenzModel()
    m.init({ A: 4, Bamp: 1.2, R: 1, omega: 1 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, lenzMeta)).toBeCloseTo(2 * Math.PI, 5)
  })
})
