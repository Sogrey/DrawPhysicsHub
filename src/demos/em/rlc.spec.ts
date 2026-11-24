import { describe, expect, it } from 'vitest'
import { createRlcModel, rlcImpedance, rlcMeta } from './rlc'
import { resolveTMax } from '@/core/physics/types'

describe('RLC', () => {
  it('peaks near w0', () => {
    const w0 = rlcImpedance(0.4, 1, 0.5, 1).w0
    const near = rlcImpedance(0.4, 1, 0.5, w0).I
    const far = rlcImpedance(0.4, 1, 0.5, w0 * 2.5).I
    expect(near).toBeGreaterThan(far)
  })

  it('uses tMax', () => {
    const m = createRlcModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, rlcMeta)).toBeCloseTo(8, 5)
  })
})
