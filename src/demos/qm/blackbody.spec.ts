import { describe, expect, it } from 'vitest'
import { blackbodyMeta, createBlackbodyModel, planckSpectral, wienPeakLambda } from './blackbody'
import { resolveTMax } from '@/core/physics/types'

describe('Blackbody radiation', () => {
  it('peak shifts to shorter λ when T rises', () => {
    expect(wienPeakLambda(2)).toBeLessThan(wienPeakLambda(1))
  })

  it('spectrum is positive near peak', () => {
    const T = 1.2
    const L = wienPeakLambda(T)
    expect(planckSpectral(L, T)).toBeGreaterThan(0)
  })

  it('uses tMax', () => {
    const m = createBlackbodyModel()
    m.init({ T: 1.2 })
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, blackbodyMeta)).toBeCloseTo(8, 5)
  })
})
