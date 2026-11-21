import { describe, expect, it } from 'vitest'
import {
  createGratingModel,
  gratingFactor,
  gratingIntensity,
  gratingMeta,
} from './grating'
import { resolveTMax } from '@/core/physics/types'

describe('diffraction grating', () => {
  it('puts first principal max at y1 = λ L / d', () => {
    const m = createGratingModel()
    m.init({ lambda: 0.5, d: 1.2, a: 0.35, L: 6, N: 5 })
    expect(Number(m.observe().values.y1)).toBeCloseTo(2.5, 5)
  })

  it('is bright at center', () => {
    const g = gratingIntensity(0, 0.5, 0.35, 1.2, 6, 5)
    expect(g.I).toBeCloseTo(1, 5)
  })

  it('is bright at first principal maximum', () => {
    const y1 = (0.5 * 6) / 1.2
    const g = gratingIntensity(y1, 0.5, 0.35, 1.2, 6, 5)
    expect(g.I).toBeGreaterThan(0.5)
  })

  it('grating factor peaks at δ = 2π m', () => {
    expect(gratingFactor(5, 0)).toBeCloseTo(25, 5)
    expect(gratingFactor(5, 2 * Math.PI)).toBeCloseTo(25, 5)
  })

  it('uses tMax protocol', () => {
    const m = createGratingModel()
    m.init({ lambda: 0.5, d: 1.2, a: 0.35, L: 6, N: 5 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, gratingMeta)).toBeCloseTo(8, 5)
  })
})
