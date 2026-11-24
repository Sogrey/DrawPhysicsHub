import { describe, expect, it } from 'vitest'
import { createEntropyModel, entropyChange, entropyMeta } from './entropy'
import { resolveTMax } from '@/core/physics/types'

describe('Entropy free expansion', () => {
  it('ΔS = n ln(V2/V1)', () => {
    expect(entropyChange(1, 1.2, 3.2)).toBeCloseTo(Math.log(3.2 / 1.2), 8)
  })

  it('keeps dU=0 and uses tMax', () => {
    const m = createEntropyModel()
    m.init({ n: 1, V1: 1.2, V2: 3.2 })
    expect(Number(m.observe().values.dU)).toBe(0)
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, entropyMeta)).toBeCloseTo(8, 5)
  })
})
