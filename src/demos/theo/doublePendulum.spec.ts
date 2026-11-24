import { describe, expect, it } from 'vitest'
import {
  createDoublePendulumModel,
  doublePendulumAccels,
  doublePendulumMeta,
} from './doublePendulum'
import { resolveTMax } from '@/core/physics/types'

describe('Double pendulum', () => {
  it('gives finite accelerations at rest hanging', () => {
    const [a1, a2] = doublePendulumAccels(0.1, 0.05, 0, 0, 1, 1, 1, 1)
    expect(Number.isFinite(a1)).toBe(true)
    expect(Number.isFinite(a2)).toBe(true)
  })

  it('moves away from large initial angle', () => {
    const m = createDoublePendulumModel()
    m.init({ L1: 1.2, L2: 1, m1: 1, m2: 1, th1: 120, th2: -10 })
    const y0 = Number(m.observe().values.y2)
    m.seek?.(1.5)
    const y1 = Number(m.observe().values.y2)
    expect(Math.abs(y1 - y0)).toBeGreaterThan(0.05)
  })

  it('uses tMax', () => {
    const m = createDoublePendulumModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, doublePendulumMeta)).toBeCloseTo(12, 5)
  })
})
