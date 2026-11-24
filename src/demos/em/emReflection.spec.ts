import { describe, expect, it } from 'vitest'
import { createEmReflectionModel, fresnelNormal, emReflectionMeta } from './emReflection'
import { resolveTMax } from '@/core/physics/types'

describe('EM reflection', () => {
  it('matched media → R=0', () => {
    const f = fresnelNormal(1.5, 1.5)
    expect(f.r).toBeCloseTo(0, 8)
    expect(f.R).toBeCloseTo(0, 8)
  })

  it('dense → R>0', () => {
    const f = fresnelNormal(1, 2)
    expect(f.R).toBeGreaterThan(0.05)
    expect(f.T + f.R).toBeCloseTo(1, 5)
  })

  it('uses tMax', () => {
    const m = createEmReflectionModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, emReflectionMeta)).toBeCloseTo(8, 5)
  })
})
