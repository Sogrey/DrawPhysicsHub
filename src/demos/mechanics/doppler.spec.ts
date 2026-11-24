import { describe, expect, it } from 'vitest'
import { createDopplerModel, dopplerFreq, dopplerMeta } from './doppler'
import { resolveTMax } from '@/core/physics/types'

describe('Doppler', () => {
  it('approach raises frequency', () => {
    expect(dopplerFreq(2, 0.5, 2, true)).toBeGreaterThan(2)
    expect(dopplerFreq(2, 0.5, 2, false)).toBeLessThan(2)
  })

  it('uses tMax', () => {
    const m = createDopplerModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, dopplerMeta)).toBeCloseTo(8, 5)
  })
})
