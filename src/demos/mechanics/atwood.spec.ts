import { describe, expect, it } from 'vitest'
import { atwoodAccel, atwoodMeta, atwoodTension, createAtwoodModel } from './atwood'
import { resolveTMax } from '@/core/physics/types'

describe('Atwood', () => {
  it('equal masses → a=0', () => {
    expect(atwoodAccel(1, 1)).toBeCloseTo(0, 8)
  })

  it('heavier m2 descends', () => {
    expect(atwoodAccel(1, 2)).toBeGreaterThan(0)
  })

  it('tension between weights', () => {
    // 等质量：T = mg
    const T = atwoodTension(1, 1, 10)
    expect(T).toBeCloseTo(10, 5)
  })

  it('uses tMax', () => {
    const m = createAtwoodModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, atwoodMeta)).toBeCloseTo(6, 5)
  })
})
