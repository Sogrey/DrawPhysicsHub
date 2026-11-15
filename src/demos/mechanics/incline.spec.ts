import { describe, expect, it } from 'vitest'
import { createInclineModel, inclineMeta } from './incline'
import { resolveTMax } from '@/core/physics/types'

describe('incline slider', () => {
  it('matches a = g(sinθ − μ cosθ) and arrives with v²=2aL', () => {
    const m = createInclineModel()
    m.init({ theta: 30, mu: 0.1, L: 5 })
    const a = Number(m.observe().values.a)
    const th = Math.PI / 6
    expect(a).toBeCloseTo(9.8 * (Math.sin(th) - 0.1 * Math.cos(th)), 5)
    const T = Number(m.observe().values.tMax)
    m.seek?.(T)
    const snap = m.observe()
    expect(Number(snap.values.s)).toBeCloseTo(5, 4)
    expect(Number(snap.values.v)).toBeCloseTo(Math.sqrt(2 * a * 5), 3)
  })

  it('does not slide when μ ≥ tanθ', () => {
    const m = createInclineModel()
    m.init({ theta: 30, mu: 0.7, L: 5 })
    expect(Number(m.observe().values.sliding)).toBe(0)
    expect(Number(m.observe().values.a)).toBeLessThanOrEqual(0)
  })

  it('uses tMax protocol', () => {
    const m = createInclineModel()
    m.init({ theta: 40, mu: 0, L: 4 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, inclineMeta)).toBe(Number(live.tMax))
  })
})
