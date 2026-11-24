import { describe, expect, it } from 'vitest'
import { createDiffusionModel, diffusionMeta } from './diffusion'
import { resolveTMax } from '@/core/physics/types'

describe('Diffusion', () => {
  it('r2Theory = 4 D t', () => {
    const m = createDiffusionModel()
    m.init({ N: 30, D: 0.5 })
    m.seek?.(4)
    expect(Number(m.observe().values.r2Theory)).toBeCloseTo(8, 5)
  })

  it('uses tMax', () => {
    const m = createDiffusionModel()
    m.init({ N: 20, D: 0.35 })
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, diffusionMeta)).toBeCloseTo(10, 5)
  })
})
