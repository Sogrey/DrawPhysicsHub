import { describe, expect, it } from 'vitest'
import { createPendulumModel, pendulumMeta } from './pendulum'
import { resolveTMax } from '@/core/physics/types'

describe('pendulum (small angle)', () => {
  it('period is 2π√(L/g)', () => {
    const m = createPendulumModel()
    m.init({ L: 1.5, theta0: 20 })
    const T = Number(m.observe().values.period)
    expect(T).toBeCloseTo(2 * Math.PI * Math.sqrt(1.5 / 9.8), 5)
  })

  it('starts at max angle and lowest speed', () => {
    const m = createPendulumModel()
    m.init({ L: 1.2, theta0: 30 })
    const snap = m.observe()
    expect(Number(snap.values.theta)).toBeCloseTo(30, 5)
    expect(Number(snap.values.speed)).toBeCloseTo(0, 5)
  })

  it('energy roughly conserved mid-swing', () => {
    const m = createPendulumModel()
    m.init({ L: 1.5, theta0: 20 })
    const e0 = Number(m.observe().values.energy)
    m.seek?.(Number(m.observe().values.period) / 4)
    const e1 = Number(m.observe().values.energy)
    expect(e1).toBeCloseTo(e0, 3)
  })

  it('uses tMax protocol', () => {
    const m = createPendulumModel()
    m.init({ L: 1, theta0: 15 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, pendulumMeta)).toBe(Number(live.tMax))
  })
})
