import { describe, expect, it } from 'vitest'
import { centrifugalAccel, createCentrifugalModel, centrifugalMeta } from './centrifugal'
import { resolveTMax } from '@/core/physics/types'

describe('Centrifugal', () => {
  it('a = Ω²r', () => {
    expect(centrifugalAccel(1.5, 2)).toBeCloseTo(2.25 * 2, 8)
  })

  it('r grows from rest offset', () => {
    const m = createCentrifugalModel()
    m.init({ Omega: 1.2, r0: 0.4, v0: 0 })
    const r0 = Number(m.observe().values.r)
    m.seek?.(1.5)
    expect(Number(m.observe().values.r)).toBeGreaterThan(r0 + 0.2)
  })

  it('uses tMax', () => {
    const m = createCentrifugalModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, centrifugalMeta)).toBeCloseTo(4, 5)
  })
})
