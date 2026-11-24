import { describe, expect, it } from 'vitest'
import { createLegendreModel, legendreMeta, legendreP } from './legendre'
import { resolveTMax } from '@/core/physics/types'

describe('Legendre', () => {
  it('P2(1)=1', () => {
    expect(legendreP(2, 1)).toBeCloseTo(1, 8)
  })

  it('uses tMax', () => {
    const m = createLegendreModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, legendreMeta)).toBeCloseTo(8, 5)
  })
})
