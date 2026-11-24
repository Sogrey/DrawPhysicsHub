import { describe, expect, it } from 'vitest'
import {
  createLatticeGrapheneModel,
  grapheneDirac,
  latticeGrapheneMeta,
} from './latticeGraphene'
import { resolveTMax } from '@/core/physics/types'

describe('Lattice graphene', () => {
  it('Dirac linear', () => {
    const a = grapheneDirac(0.5, 2)
    expect(a.Ep).toBeCloseTo(1, 8)
    expect(a.Em).toBeCloseTo(-1, 8)
  })

  it('uses tMax', () => {
    const m = createLatticeGrapheneModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, latticeGrapheneMeta)).toBeCloseTo(8, 5)
  })
})
