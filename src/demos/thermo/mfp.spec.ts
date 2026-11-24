import { describe, expect, it } from 'vitest'
import { createMfpModel, mfpMeta, mfpTheory2d } from './mfp'
import { resolveTMax } from '@/core/physics/types'

describe('Mean free path', () => {
  it('λ scales as 1/(n d)', () => {
    const a = mfpTheory2d(1, 0.2)
    const b = mfpTheory2d(2, 0.2)
    const c = mfpTheory2d(1, 0.4)
    expect(b).toBeCloseTo(a / 2, 8)
    expect(c).toBeCloseTo(a / 2, 8)
  })

  it('uses tMax and reports theory λ', () => {
    const m = createMfpModel()
    m.init({ N: 24, T: 1.2, diameter: 0.22, boxW: 7, boxH: 5 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, mfpMeta)).toBeCloseTo(12, 5)
    expect(Number(snap.values.lambdaTh)).toBeCloseTo(mfpTheory2d(24 / 35, 0.22), 5)
  })
})
