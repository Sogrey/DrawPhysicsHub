import { describe, expect, it } from 'vitest'
import { beatEnvelope, beatsMeta, createBeatsModel } from './beats'
import { resolveTMax } from '@/core/physics/types'

describe('Beats', () => {
  it('beat period from Δω', () => {
    const b = beatEnvelope(1, 2 * Math.PI * 2, 2 * Math.PI * 2.5, 0)
    expect(b.Tbeat).toBeCloseTo(2, 5)
  })

  it('uses tMax', () => {
    const m = createBeatsModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, beatsMeta)).toBeCloseTo(12, 5)
  })
})
