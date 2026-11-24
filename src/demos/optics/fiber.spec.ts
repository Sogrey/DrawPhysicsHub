import { describe, expect, it } from 'vitest'
import { createFiberModel, criticalAngleDeg, fiberMeta } from './fiber'
import { resolveTMax } from '@/core/physics/types'

describe('Fiber', () => {
  it('critical angle for equal n is 90°', () => {
    expect(criticalAngleDeg(1.5, 1.5)).toBeCloseTo(90, 4)
  })

  it('uses tMax', () => {
    const m = createFiberModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, fiberMeta)).toBeCloseTo(8, 5)
  })
})
