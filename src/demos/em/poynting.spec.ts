import { describe, expect, it } from 'vitest'
import { createPoyntingModel, poyntingMag, poyntingMeta } from './poynting'
import { resolveTMax } from '@/core/physics/types'

describe('Poynting', () => {
  it('magnitude is |E||B|', () => {
    expect(poyntingMag(2, 3)).toBeCloseTo(6, 8)
    expect(poyntingMag(-2, 3)).toBeCloseTo(6, 8)
  })

  it('uses tMax', () => {
    const m = createPoyntingModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, poyntingMeta)).toBeCloseTo(8, 5)
  })
})
