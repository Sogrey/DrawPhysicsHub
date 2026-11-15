import { describe, expect, it } from 'vitest'
import { createCollisionModel, collisionMeta } from './collision'
import { resolveTMax } from '@/core/physics/types'

describe('collision1d model', () => {
  it('equal mass, target at rest → velocity exchange after impact', () => {
    const m = createCollisionModel()
    m.init({ m1: 1, m2: 1, u1: 4, u2: 0 })
    const tc = Number(m.observe().values.tCollide)
    expect(tc).toBeGreaterThan(0)
    m.seek?.(tc + 0.05)
    const snap = m.observe()
    expect(Number(snap.values.collided)).toBe(1)
    expect(Number(snap.values.v1)).toBeCloseTo(0, 5)
    expect(Number(snap.values.v2)).toBeCloseTo(4, 5)
  })

  it('conserves momentum and kinetic energy across collision', () => {
    const m = createCollisionModel()
    m.init({ m1: 2, m2: 1, u1: 3, u2: -1 })
    const before = m.observe()
    const p0 = Number(before.values.momentum0)
    const ke0 = Number(before.values.ke0)
    m.seek?.(Number(before.values.tCollide) + 0.1)
    const after = m.observe()
    expect(Number(after.values.momentum)).toBeCloseTo(p0, 5)
    expect(Number(after.values.ke)).toBeCloseTo(ke0, 5)
  })

  it('resolveTMax uses tMax protocol key', () => {
    const m = createCollisionModel()
    m.init({ m1: 1, m2: 1, u1: 4, u2: 0 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, collisionMeta)).toBe(Number(live.tMax))
  })
})
