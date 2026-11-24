import { describe, expect, it } from 'vitest'
import { createRcTransientModel, rcCharge, rcTransientMeta } from './rcTransient'
import { resolveTMax } from '@/core/physics/types'

describe('RC transient', () => {
  it('fills toward V0', () => {
    const a = rcCharge(5, 2, 1, 0)
    const b = rcCharge(5, 2, 1, 10)
    expect(a.Vc).toBeLessThan(1)
    expect(b.Vc).toBeGreaterThan(4)
  })

  it('uses tMax', () => {
    const m = createRcTransientModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, rcTransientMeta)).toBeCloseTo(10, 5)
  })
})
