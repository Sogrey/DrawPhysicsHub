import { describe, expect, it } from 'vitest'
import { createBirefringenceSnellModel, snellOE, birefringenceSnellMeta } from './birefringenceSnell'
import { resolveTMax } from '@/core/physics/types'

describe('Birefringence Snell', () => {
  it('separates o/e for calcite-like', () => {
    const s = snellOE(40, 1.66, 1.49)
    expect(s.thetaE).toBeGreaterThan(s.thetaO)
  })

  it('model Δθ grows with angle', () => {
    const m = createBirefringenceSnellModel()
    m.init({ nO: 1.66, nE: 1.49, thetaMax: 55 })
    m.seek?.(2)
    const d1 = Math.abs(Number(m.observe().values.dTheta))
    m.seek?.(6)
    expect(Math.abs(Number(m.observe().values.dTheta))).toBeGreaterThan(d1 - 0.01)
  })

  it('uses tMax', () => {
    const m = createBirefringenceSnellModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, birefringenceSnellMeta)).toBeCloseTo(8, 5)
  })
})
