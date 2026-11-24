import { describe, expect, it } from 'vitest'
import { complexF, createComplexSurfModel, complexSurfMeta } from './complexSurf'
import { resolveTMax } from '@/core/physics/types'

describe('Complex surf', () => {
  it('z² at 1+0i', () => {
    const f = complexF(1, 0, 1)
    expect(f.mod).toBeCloseTo(1, 5)
  })

  it('1/z blows up near 0', () => {
    expect(complexF(0.1, 0, 2).mod).toBeGreaterThan(5)
  })

  it('uses tMax', () => {
    const m = createComplexSurfModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, complexSurfMeta)).toBeCloseTo(8, 5)
  })
})
