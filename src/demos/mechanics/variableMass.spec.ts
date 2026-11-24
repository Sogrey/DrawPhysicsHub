import { describe, expect, it } from 'vitest'
import { createVariableMassModel, rocketDeltaV, variableMassMeta } from './variableMass'
import { resolveTMax } from '@/core/physics/types'

describe('VariableMass', () => {
  it('no burn → Δv=0', () => {
    expect(rocketDeltaV(3, 3, 2)).toBeCloseTo(0, 8)
  })

  it('half mass → u ln2', () => {
    expect(rocketDeltaV(2, 1, 1)).toBeCloseTo(Math.LN2, 6)
  })

  it('uses tMax', () => {
    const m = createVariableMassModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, variableMassMeta)).toBeCloseTo(8, 5)
  })
})
