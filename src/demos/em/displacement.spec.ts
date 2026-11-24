import { describe, expect, it } from 'vitest'
import { createDisplacementModel, displacementCurrent, displacementMeta } from './displacement'
import { resolveTMax } from '@/core/physics/types'

describe('Displacement current', () => {
  it('Id = εA dE/dt', () => {
    expect(displacementCurrent(2, 0.5)).toBeCloseTo(1, 8)
  })

  it('Id falls as E rises', () => {
    const m = createDisplacementModel()
    m.init({ V0: 2, tau: 2, area: 1 })
    m.seek?.(0.1)
    const id0 = Number(m.observe().values.Id)
    m.seek?.(4)
    expect(Number(m.observe().values.Id)).toBeLessThan(id0)
    expect(Number(m.observe().values.E)).toBeGreaterThan(1)
  })

  it('uses tMax', () => {
    const m = createDisplacementModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, displacementMeta)).toBeCloseTo(8, 5)
  })
})
