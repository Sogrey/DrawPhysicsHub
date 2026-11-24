import { describe, expect, it } from 'vitest'
import { besselJ0, besselMeta, createBesselModel } from './bessel'
import { resolveTMax } from '@/core/physics/types'

describe('Bessel', () => {
  it('J0(0)=1', () => {
    expect(besselJ0(0)).toBeCloseTo(1, 6)
  })

  it('uses tMax', () => {
    const m = createBesselModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, besselMeta)).toBeCloseTo(8, 5)
  })
})
