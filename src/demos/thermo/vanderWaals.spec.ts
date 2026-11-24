import { describe, expect, it } from 'vitest'
import { createVanderWaalsModel, vanderWaalsMeta, vdwPressure } from './vanderWaals'
import { resolveTMax } from '@/core/physics/types'

describe('VanderWaals', () => {
  it('reduces toward ideal when a=b=0', () => {
    expect(vdwPressure(2, 2, 0, 0, 1)).toBeCloseTo(1, 6)
  })

  it('uses tMax', () => {
    const m = createVanderWaalsModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, vanderWaalsMeta)).toBeCloseTo(8, 5)
  })
})
