import { describe, expect, it } from 'vitest'
import { createGasModel, gasMeta } from './gas'
import { resolveTMax } from '@/core/physics/types'

describe('thermo gas pressure', () => {
  it('exposes pressure readouts and tMax', () => {
    const m = createGasModel()
    m.init({ N: 30, T: 1.2, boxW: 6, boxH: 4 })
    m.step(0.5)
    const snap = m.observe()
    expect(Number(snap.values.N)).toBe(30)
    expect(Number(snap.values.vrms)).toBeGreaterThan(0.5)
    expect(Number(snap.values.Ptheory)).toBeGreaterThan(0)
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, gasMeta)).toBeCloseTo(10, 5)
  })

  it('raises vrms when T increases', () => {
    const cold = createGasModel()
    cold.init({ N: 40, T: 0.5, boxW: 6, boxH: 4 })
    const hot = createGasModel()
    hot.init({ N: 40, T: 2.2, boxW: 6, boxH: 4 })
    expect(Number(hot.observe().values.vrms)).toBeGreaterThan(Number(cold.observe().values.vrms))
  })

  it('accumulates wall collisions over time', () => {
    const m = createGasModel()
    m.init({ N: 50, T: 1.5, boxW: 5, boxH: 3.5 })
    m.step(2)
    expect(Number(m.observe().values.collisions)).toBeGreaterThan(0)
  })
})
