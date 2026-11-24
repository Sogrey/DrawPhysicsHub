import { describe, expect, it } from 'vitest'
import { createOttoModel, ottoEfficiency, ottoMeta } from './otto'
import { resolveTMax } from '@/core/physics/types'

describe('Otto', () => {
  it('efficiency rises with compression ratio', () => {
    expect(ottoEfficiency(10)).toBeGreaterThan(ottoEfficiency(6))
  })

  it('uses tMax', () => {
    const m = createOttoModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, ottoMeta)).toBeCloseTo(8, 5)
  })
})
