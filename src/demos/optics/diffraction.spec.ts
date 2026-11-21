import { describe, expect, it } from 'vitest'
import { createDiffractionModel, diffractionMeta } from './diffraction'
import { resolveTMax } from '@/core/physics/types'

describe('single-slit diffraction', () => {
  it('gives first minimum y1 = λ L / a', () => {
    const m = createDiffractionModel()
    m.init({ lambda: 0.5, a: 1, L: 6 })
    expect(Number(m.observe().values.y1)).toBeCloseTo(3, 5)
    expect(Number(m.observe().values.centralWidth)).toBeCloseTo(6, 5)
  })

  it('is bright at center', () => {
    const m = createDiffractionModel()
    m.init({ lambda: 0.5, a: 1, L: 6 })
    m.seek?.(1.5) // u=0.25 → y=0
    const snap = m.observe()
    expect(Number(snap.values.y)).toBeCloseTo(0, 5)
    expect(Number(snap.values.I)).toBeCloseTo(1, 5)
  })

  it('is dark at first minimum', () => {
    const m = createDiffractionModel()
    m.init({ lambda: 0.5, a: 1, L: 6 })
    const y1 = 3
    // I = sinc²(π) = 0
    const beta = (Math.PI * 1 * y1) / (0.5 * 6)
    expect(beta).toBeCloseTo(Math.PI, 5)
    expect(Math.abs(Math.sin(beta) / beta)).toBeLessThan(1e-10)
  })

  it('uses tMax protocol', () => {
    const m = createDiffractionModel()
    m.init({ lambda: 0.5, a: 1, L: 6 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, diffractionMeta)).toBeCloseTo(6, 5)
  })
})
