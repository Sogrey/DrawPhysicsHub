import { describe, expect, it } from 'vitest'
import { createThinFilmModel, thinFilmMeta, thinFilmState } from './thinFilm'
import { resolveTMax } from '@/core/physics/types'

describe('thin film interference', () => {
  it('is dark when 2nd = mλ (with half-wave loss)', () => {
    // 2*1.33*d = 1*0.55 → d = 0.55/(2*1.33)
    const d = 0.55 / (2 * 1.33)
    const s = thinFilmState(1.33, d, 0.55)
    expect(s.I).toBeLessThan(0.08)
    expect(s.dark).toBe(true)
  })

  it('is bright when 2nd = (m+1/2)λ', () => {
    const d = (0.5 * 0.55) / (2 * 1.33)
    const s = thinFilmState(1.33, d, 0.55)
    expect(s.I).toBeGreaterThan(0.9)
    expect(s.bright).toBe(true)
  })

  it('delta equals 2 n d', () => {
    const s = thinFilmState(1.5, 0.4, 0.5)
    expect(s.delta).toBeCloseTo(1.2, 5)
  })

  it('model exposes tMax and sweeps thickness', () => {
    const m = createThinFilmModel()
    m.init({ n: 1.33, lambda: 0.55, dMax: 1.2 })
    m.seek?.(0.1)
    const a = m.observe()
    m.seek?.(8)
    const b = m.observe()
    expect(Number(b.values.d)).toBeGreaterThan(Number(a.values.d))
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(a.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, thinFilmMeta)).toBeCloseTo(8, 5)
  })
})
