import { describe, expect, it } from 'vitest'
import { createStandingWaveModel, standingWaveMeta } from './standingWave'
import { resolveTMax } from '@/core/physics/types'

describe('standing wave', () => {
  it('keeps nodes at zero for all t', () => {
    const m = createStandingWaveModel()
    m.init({ A: 0.6, lambda: 4, period: 2 })
    for (const ti of [0, 0.3, 0.7, 1.2, 1.9]) {
      m.seek?.(ti)
      const snap = m.observe()
      expect(Number(snap.values.yNode)).toBeCloseTo(0, 5)
      expect(Number(snap.values.checkNode)).toBeCloseTo(0, 5)
    }
  })

  it('has antinode amplitude 2A', () => {
    const m = createStandingWaveModel()
    m.init({ A: 0.5, lambda: 4, period: 2 })
    m.seek?.(0) // cos(ωt)=1
    const snap = m.observe()
    expect(Number(snap.values.ampMax)).toBeCloseTo(1, 5)
    expect(Number(snap.values.yAnti)).toBeCloseTo(1, 5)
  })

  it('matches 2A cos(kx) cos(ωt) on the sampled profile', () => {
    const m = createStandingWaveModel()
    m.init({ A: 0.8, lambda: 4, period: 2 })
    m.seek?.(0.25)
    const snap = m.observe()
    const A = 0.8
    const k = (2 * Math.PI) / 4
    const w = Math.PI
    const path = snap.trails?.path ?? []
    const sample = path[Math.floor(path.length / 3)]
    expect(sample).toBeTruthy()
    const x = sample![0]!
    expect(sample![1]).toBeCloseTo(2 * A * Math.cos(k * x) * Math.cos(w * 0.25), 4)
  })

  it('uses tMax protocol', () => {
    const m = createStandingWaveModel()
    m.init({ A: 0.6, lambda: 4, period: 2.5 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, standingWaveMeta)).toBeCloseTo(2.5, 5)
  })
})
