import { describe, expect, it } from 'vitest'
import { createFineStructureModel, fineShift, fineStructureMeta } from './fineStructure'
import { resolveTMax } from '@/core/physics/types'

describe('FineStructure', () => {
  it('shift shrinks with larger n', () => {
    expect(Math.abs(fineShift(2, 0.5))).toBeGreaterThan(Math.abs(fineShift(4, 0.5)))
  })

  it('uses tMax', () => {
    const m = createFineStructureModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, fineStructureMeta)).toBeCloseTo(8, 5)
  })
})
