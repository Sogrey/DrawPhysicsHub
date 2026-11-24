import { describe, expect, it } from 'vitest'
import { createCoupledOscModel, coupledOscMeta, normalFreqs } from './coupledOsc'
import { resolveTMax } from '@/core/physics/types'

describe('Coupled osc', () => {
  it('asym higher than sym', () => {
    const f = normalFreqs(1.2, 0.6, 1)
    expect(f.wAsym).toBeGreaterThan(f.wSym)
  })

  it('uses tMax', () => {
    const m = createCoupledOscModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, coupledOscMeta)).toBeCloseTo(10, 5)
  })
})
