import { describe, expect, it } from 'vitest'
import {
  createMaxwellModel,
  maxwellMeta,
  maxwellPdf,
  maxwellVavg,
  maxwellVp,
  maxwellVrms,
} from './maxwell'
import { resolveTMax } from '@/core/physics/types'

describe('Maxwell speed distribution', () => {
  it('orders vp < vavg < vrms', () => {
    const T = 1.2
    expect(maxwellVp(T)).toBeLessThan(maxwellVavg(T))
    expect(maxwellVavg(T)).toBeLessThan(maxwellVrms(T))
    expect(maxwellVp(T)).toBeCloseTo(Math.sqrt(2 * T), 8)
    expect(maxwellVrms(T)).toBeCloseTo(Math.sqrt(3 * T), 8)
  })

  it('pdf peaks near vp', () => {
    const T = 1
    const vp = maxwellVp(T)
    const fPeak = maxwellPdf(vp, T)
    expect(maxwellPdf(vp * 0.7, T)).toBeLessThan(fPeak)
    expect(maxwellPdf(vp * 1.4, T)).toBeLessThan(fPeak)
  })

  it('uses tMax protocol and accumulates samples', () => {
    const m = createMaxwellModel()
    m.init({ T: 1.2, nSample: 200 })
    m.step(0.5)
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, maxwellMeta)).toBeCloseTo(10, 5)
    expect(Number(snap.values.total)).toBeGreaterThan(50)
  })
})
