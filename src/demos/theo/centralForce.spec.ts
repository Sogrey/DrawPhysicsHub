import { describe, expect, it } from 'vitest'
import { centralAccel, createCentralForceModel, centralForceMeta } from './centralForce'
import { resolveTMax } from '@/core/physics/types'

describe('Central force', () => {
  it('points toward origin', () => {
    const a = centralAccel(4, 2, 0)
    expect(a.ax).toBeLessThan(0)
    expect(a.ay).toBeCloseTo(0, 8)
  })

  it('keeps finite orbit for e=0.4', () => {
    const m = createCentralForceModel()
    m.init({ k: 4, e: 0.4 })
    m.seek?.(3)
    const r = Number(m.observe().values.r)
    expect(r).toBeGreaterThan(0.3)
    expect(r).toBeLessThan(8)
  })

  it('uses tMax', () => {
    const m = createCentralForceModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, centralForceMeta)).toBeCloseTo(12, 5)
  })
})
