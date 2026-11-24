import { describe, expect, it } from 'vitest'
import { createFaradayDiskModel, faradayDiskMeta, faradayEmf } from './faradayDisk'
import { resolveTMax } from '@/core/physics/types'

describe('FaradayDisk', () => {
  it('emf = 1/2 B ω R²', () => {
    expect(faradayEmf(2, 2, 1)).toBeCloseTo(2, 6)
    expect(faradayEmf(1, 0, 2)).toBeCloseTo(0, 8)
  })

  it('uses tMax', () => {
    const m = createFaradayDiskModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, faradayDiskMeta)).toBeCloseTo(8, 5)
  })
})
