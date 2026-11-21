import { describe, expect, it } from 'vitest'
import { createRefractionModel, refractionMeta, snell } from './refraction'
import { resolveTMax } from '@/core/physics/types'

describe('refraction / Snell', () => {
  it('reflects with θr = θ1', () => {
    const s = snell(1, 1.5, 30)
    expect(s.thetaR).toBeCloseTo(30, 5)
  })

  it('obeys Snell for air→glass', () => {
    const s = snell(1, 1.5, 30)
    expect(s.tir).toBe(false)
    const lhs = 1 * Math.sin((30 * Math.PI) / 180)
    const rhs = 1.5 * Math.sin((s.theta2 * Math.PI) / 180)
    expect(lhs).toBeCloseTo(rhs, 5)
    expect(s.theta2).toBeLessThan(30)
  })

  it('detects TIR glass→air past critical', () => {
    const c = snell(1.5, 1, 30)
    expect(c.tir).toBe(false)
    expect(c.critical).toBeCloseTo((Math.asin(1 / 1.5) * 180) / Math.PI, 4)
    const s = snell(1.5, 1, 50)
    expect(s.tir).toBe(true)
  })

  it('model sweeps and exposes tMax', () => {
    const m = createRefractionModel()
    m.init({ n1: 1, n2: 1.5, theta1Max: 60 })
    m.seek?.(4) // half of period 8 → θ1=30
    const snap = m.observe()
    expect(Number(snap.values.theta1)).toBeCloseTo(30, 4)
    expect(Number(snap.values.thetaR)).toBeCloseTo(30, 4)
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, refractionMeta)).toBeCloseTo(8, 5)
  })
})
