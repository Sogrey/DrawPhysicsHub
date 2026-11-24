import { describe, expect, it } from 'vitest'
import { createLatticeDiModel, diatomicBranches, latticeDiMeta } from './latticeDi'
import { resolveTMax } from '@/core/physics/types'

describe('Lattice di', () => {
  it('optical above acoustic', () => {
    const b = diatomicBranches(1, 1, 1, 0.7, 1.4)
    expect(b.wOp).toBeGreaterThan(b.wAc)
  })

  it('acoustic → 0 at k=0', () => {
    expect(diatomicBranches(0, 1, 1, 0.7, 1.4).wAc).toBeCloseTo(0, 5)
  })

  it('uses tMax', () => {
    const m = createLatticeDiModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, latticeDiMeta)).toBeCloseTo(8, 5)
  })
})
