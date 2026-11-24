import { describe, expect, it } from 'vitest'
import {
  createQmDoubleSlitModel,
  doubleSlitIntensity,
  qmDoubleSlitMeta,
} from './doubleSlit'
import { resolveTMax } from '@/core/physics/types'

describe('QM double slit', () => {
  it('central intensity is max', () => {
    expect(doubleSlitIntensity(0, 1.2, 0.35, 4)).toBeCloseTo(1, 5)
    expect(doubleSlitIntensity(0, 1.2, 0.35, 4)).toBeGreaterThan(
      doubleSlitIntensity(1.5, 1.2, 0.35, 4),
    )
  })

  it('fringe ≈ λL/d', () => {
    const m = createQmDoubleSlitModel()
    m.init({ d: 1.2, lambda: 0.35, L: 4 })
    expect(Number(m.observe().values.fringe)).toBeCloseTo((0.35 * 4) / 1.2, 5)
  })

  it('uses tMax', () => {
    const m = createQmDoubleSlitModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, qmDoubleSlitMeta)).toBeCloseTo(8, 5)
  })
})
