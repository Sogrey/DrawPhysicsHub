import { describe, expect, it } from 'vitest'
import { collision2dMeta, createCollision2dModel, elastic2dEqualMass } from './collision2d'
import { resolveTMax } from '@/core/physics/types'

describe('Collision2d', () => {
  it('head-on equal mass exchanges velocities', () => {
    const v = elastic2dEqualMass(3, 0, 0, 0, 1, 0)
    expect(v.v1x).toBeCloseTo(0, 6)
    expect(v.v2x).toBeCloseTo(3, 6)
  })

  it('uses tMax', () => {
    const m = createCollision2dModel()
    m.init({ b: 0.5, u: 3 })
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, collision2dMeta)).toBeCloseTo(6, 5)
  })
})
