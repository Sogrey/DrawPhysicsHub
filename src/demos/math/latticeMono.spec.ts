import { describe, expect, it } from 'vitest'
import { createLatticeMonoModel, latticeMonoMeta, monoDispersion } from './latticeMono'
import { resolveTMax } from '@/core/physics/types'

describe('Lattice mono', () => {
  it('ω(0)=0 and peaks at zone edge', () => {
    expect(monoDispersion(0, 1, 1, 1)).toBeCloseTo(0, 8)
    const edge = monoDispersion(Math.PI, 1, 1, 1)
    expect(edge).toBeCloseTo(2, 5)
  })

  it('uses tMax', () => {
    const m = createLatticeMonoModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, latticeMonoMeta)).toBeCloseTo(8, 5)
  })
})
