import { describe, expect, it } from 'vitest'
import { createVelocityAddModel, velocityAdd, velocityAddMeta } from './velocityAdd'
import { resolveTMax } from '@/core/physics/types'

describe('VelocityAdd', () => {
  it('never reaches c for subluminal inputs', () => {
    expect(Math.abs(velocityAdd(0.9, 0.9))).toBeLessThan(1)
  })

  it('reduces to classical at low speed', () => {
    expect(velocityAdd(0.01, 0.02)).toBeCloseTo(0.03, 4)
  })

  it('uses tMax', () => {
    const m = createVelocityAddModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, velocityAddMeta)).toBeCloseTo(8, 5)
  })
})
