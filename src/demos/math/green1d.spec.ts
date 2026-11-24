import { describe, expect, it } from 'vitest'
import { createGreen1dModel, green1d, green1dMeta } from './green1d'
import { resolveTMax } from '@/core/physics/types'

describe('Green1d', () => {
  it('vanishes at endpoints', () => {
    expect(green1d(0, 0.4)).toBeCloseTo(0, 8)
    expect(green1d(1, 0.4)).toBeCloseTo(0, 8)
  })

  it('peaks at source', () => {
    expect(green1d(0.4, 0.4)).toBeGreaterThan(green1d(0.2, 0.4))
  })

  it('uses tMax', () => {
    const m = createGreen1dModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, green1dMeta)).toBeCloseTo(8, 5)
  })
})
