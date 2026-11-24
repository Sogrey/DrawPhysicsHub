import { describe, expect, it } from 'vitest'
import { createSphericalHarmonicsModel, realYlm, sphericalHarmonicsMeta } from './sphericalHarmonics'
import { resolveTMax } from '@/core/physics/types'

describe('Spherical harmonics', () => {
  it('Y10 peaks along z', () => {
    expect(Math.abs(realYlm(1, 0, 0, 0))).toBeGreaterThan(Math.abs(realYlm(1, 0, Math.PI / 2, 0)))
  })

  it('uses tMax', () => {
    const m = createSphericalHarmonicsModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, sphericalHarmonicsMeta)).toBeCloseTo(8, 5)
  })
})
