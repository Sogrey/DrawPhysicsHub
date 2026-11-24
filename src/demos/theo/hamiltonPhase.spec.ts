import { describe, expect, it } from 'vitest'
import { createHamiltonPhaseModel, hamiltonPhaseMeta, hamiltonPoint } from './hamiltonPhase'
import { resolveTMax } from '@/core/physics/types'

describe('HamiltonPhase', () => {
  it('conserves H', () => {
    const a = hamiltonPoint(1, 1, 0)
    const b = hamiltonPoint(1, 1, 1.3)
    expect(b.H).toBeCloseTo(a.H, 6)
  })

  it('uses tMax', () => {
    const m = createHamiltonPhaseModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, hamiltonPhaseMeta)).toBeCloseTo(10, 5)
  })
})
