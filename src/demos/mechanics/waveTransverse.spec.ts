import { describe, expect, it } from 'vitest'
import { createWaveTransverseModel, waveTransverseMeta } from './waveTransverse'
import { resolveTMax } from '@/core/physics/types'

describe('transverse traveling wave', () => {
  it('gives v = λ/T = ω/k', () => {
    const m = createWaveTransverseModel()
    m.init({ A: 1, lambda: 4, period: 2 })
    const snap = m.observe()
    expect(Number(snap.values.v)).toBeCloseTo(2, 5)
    expect(Number(snap.values.checkV)).toBeCloseTo(0, 5)
    expect(Number(snap.values.omega)).toBeCloseTo(Math.PI, 5)
    expect(Number(snap.values.k)).toBeCloseTo(Math.PI / 2, 5)
  })

  it('keeps x=0 and x=λ in phase', () => {
    const m = createWaveTransverseModel()
    m.init({ A: 1.2, lambda: 5, period: 2.5 })
    for (const ti of [0.3, 1.1, 2.0]) {
      m.seek?.(ti)
      const snap = m.observe()
      expect(Number(snap.values.y0)).toBeCloseTo(Number(snap.values.yProbe), 5)
    }
  })

  it('shifts the profile with time (crest moves +x)', () => {
    const m = createWaveTransverseModel()
    m.init({ A: 1, lambda: 4, period: 2 })
    m.seek?.(0)
    const y0 = m.observe().trails?.path?.[0]?.[1] ?? 0
    m.seek?.(0.5) // quarter period: phase advance π/2
    // at x=0: cos(-ωt)=cos(-π/2)=0
    expect(Number(m.observe().values.y0)).toBeCloseTo(0, 5)
    // a crest that was at x=0 moves to x = v t = 1
    const path = m.observe().trails?.path ?? []
    const near = path.find((p) => Math.abs(p[0]! - 1) < 0.08)
    expect(near?.[1]).toBeCloseTo(1, 1)
    expect(y0).toBeCloseTo(1, 5)
  })

  it('uses tMax protocol', () => {
    const m = createWaveTransverseModel()
    m.init({ A: 1, lambda: 4, period: 3 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, waveTransverseMeta)).toBeCloseTo(3, 5)
  })
})
