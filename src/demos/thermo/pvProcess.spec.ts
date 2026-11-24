import { describe, expect, it } from 'vitest'
import {
  createPvProcessModel,
  processState,
  pvProcessMeta,
} from './pvProcess'
import { resolveTMax } from '@/core/physics/types'

describe('Quasi-static P–V process', () => {
  it('isothermal work equals nRT ln(V/V0)', () => {
    const V0 = 1.2
    const P0 = 2.5
    const V1 = 3.2
    const end = processState('isothermal', 1, V0, P0, V1, 1.4)
    const T = P0 * V0
    expect(end.W).toBeCloseTo(T * Math.log(V1 / V0), 5)
    expect(end.dU).toBeCloseTo(0, 8)
  })

  it('isochoric work is zero', () => {
    const end = processState('isochoric', 1, 1.2, 2.5, 3.2, 1.4)
    expect(end.W).toBeCloseTo(0, 8)
    expect(end.V).toBeCloseTo(1.2, 8)
  })

  it('adiabatic has Q=0 and W=-ΔU', () => {
    const end = processState('adiabatic', 1, 1.2, 2.5, 3.2, 1.4)
    expect(end.Q).toBeCloseTo(0, 8)
    expect(end.W).toBeCloseTo(-end.dU, 5)
  })

  it('uses tMax protocol', () => {
    const m = createPvProcessModel()
    m.init({ process: 'isothermal', V0: 1.2, P0: 2.5, V1: 3.2 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, pvProcessMeta)).toBeCloseTo(8, 5)
  })
})
