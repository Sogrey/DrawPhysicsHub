import { describe, expect, it } from 'vitest'
import { createEquipartitionModel, equipartitionMeta, heatCapacity } from './equipartition'
import { resolveTMax } from '@/core/physics/types'

describe('Equipartition', () => {
  it('monatomic gamma is 5/3', () => {
    expect(heatCapacity(3, 2).gamma).toBeCloseTo(5 / 3, 6)
  })

  it('uses tMax', () => {
    const m = createEquipartitionModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, equipartitionMeta)).toBeCloseTo(8, 5)
  })
})
