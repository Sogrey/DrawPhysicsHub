import { describe, expect, it } from 'vitest'
import { brewsterAngle, createBrewsterModel, fresnelRP, brewsterMeta } from './brewster'
import { resolveTMax } from '@/core/physics/types'

describe('Brewster', () => {
  it('θ_B = arctan(n2/n1)', () => {
    expect(brewsterAngle(1, 1.5)).toBeCloseTo((Math.atan(1.5) * 180) / Math.PI, 5)
  })

  it('Rp dips near Brewster', () => {
    const thB = brewsterAngle(1, 1.5)
    const at = fresnelRP(thB, 1, 1.5)
    const far = fresnelRP(20, 1, 1.5)
    expect(at.Rp).toBeLessThan(far.Rp)
  })

  it('uses tMax', () => {
    const m = createBrewsterModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, brewsterMeta)).toBeCloseTo(8, 5)
  })
})
