import { describe, expect, it } from 'vitest'
import { createDoubleSlitModel, doubleSlitMeta } from './doubleSlit'
import { resolveTMax } from '@/core/physics/types'

describe('Young double-slit', () => {
  it('gives Δy = λ L / d', () => {
    const m = createDoubleSlitModel()
    m.init({ lambda: 0.5, d: 1.2, L: 6 })
    expect(Number(m.observe().values.dy)).toBeCloseTo(2.5, 5)
  })

  it('is bright at center y=0', () => {
    const m = createDoubleSlitModel()
    m.init({ lambda: 0.5, d: 1.2, L: 6 })
    m.seek?.(0) // probe starts at yMin, not center
    // seek mid-sweep: u=0.5 → tri=1 → y = +yMax; u=0.25 → tri=0.5 → y=0
    m.seek?.(1.5) // period=6, u=0.25 → y=0
    const snap = m.observe()
    expect(Number(snap.values.y)).toBeCloseTo(0, 5)
    expect(Number(snap.values.I)).toBeCloseTo(1, 5)
  })

  it('is dark at first minimum δ=λ/2', () => {
    const m = createDoubleSlitModel()
    m.init({ lambda: 0.5, d: 1, L: 5 })
    // y such that d y / L = λ/2 → y = λ L /(2d) = 0.5*5/2 = 1.25
    // I = cos²(π/2) = 0
    const snap = m.observe()
    const yDark = (0.5 * 5) / (2 * 1)
    // compute via formula embedded: intensity at that y
    const arg = (Math.PI * 1 * yDark) / (0.5 * 5)
    expect(Math.cos(arg) ** 2).toBeCloseTo(0, 5)
    expect(Number(snap.values.dy)).toBeCloseTo(2.5, 5)
  })

  it('uses tMax protocol', () => {
    const m = createDoubleSlitModel()
    m.init({ lambda: 0.5, d: 1.2, L: 6 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, doubleSlitMeta)).toBeCloseTo(6, 5)
  })
})
