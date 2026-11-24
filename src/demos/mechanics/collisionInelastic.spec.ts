import { describe, expect, it } from 'vitest'
import {
  createCollisionInelasticModel,
  collisionInelasticMeta,
  inelasticVel,
} from './collisionInelastic'
import { resolveTMax } from '@/core/physics/types'

describe('Collision inelastic', () => {
  it('e=0 → same velocity', () => {
    const { v1, v2 } = inelasticVel(1, 1, 4, 0, 0)
    expect(v1).toBeCloseTo(2, 5)
    expect(v2).toBeCloseTo(2, 5)
  })

  it('loses KE for e<1', () => {
    const m = createCollisionInelasticModel()
    m.init({ e: 0.3, m1: 1, m2: 1, u1: 4, u2: 0 })
    m.seek?.(10)
    expect(Number(m.observe().values.dK)).toBeGreaterThan(0.5)
  })

  it('uses tMax', () => {
    const m = createCollisionInelasticModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, collisionInelasticMeta)).toBeGreaterThan(1)
  })
})
