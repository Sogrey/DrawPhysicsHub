import { describe, expect, it } from 'vitest'
import { contractedLength, createTimeDilationModel, dilatedTime, timeDilationMeta } from './timeDilation'
import { lorentzGamma } from './minkowski'
import { resolveTMax } from '@/core/physics/types'

describe('TimeDilation', () => {
  it('dilates time by gamma', () => {
    const g = lorentzGamma(0.6)
    expect(dilatedTime(1, 0.6)).toBeCloseTo(g, 6)
  })

  it('contracts length by 1/gamma', () => {
    const g = lorentzGamma(0.8)
    expect(contractedLength(2, 0.8)).toBeCloseTo(2 / g, 6)
  })

  it('rest frame unchanged', () => {
    expect(dilatedTime(3, 0)).toBeCloseTo(3, 8)
    expect(contractedLength(2, 0)).toBeCloseTo(2, 8)
  })

  it('uses tMax', () => {
    const m = createTimeDilationModel()
    m.init({ beta: 0.6, L0: 2 })
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, timeDilationMeta)).toBeCloseTo(8, 5)
  })
})
