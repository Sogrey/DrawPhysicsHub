import { describe, expect, it } from 'vitest'
import {
  createPotentialModel,
  potentialAt,
  potentialMeta,
} from './potential'
import { resolveTMax } from '@/core/physics/types'

describe('electrostatic potential', () => {
  it('sums kQ/r for two charges', () => {
    const charges = [
      { x: -1.2, y: 0, Q: 2 },
      { x: 1.2, y: 0, Q: -1.5 },
    ]
    const V = potentialAt(charges, 0, 2)
    const r1 = Math.hypot(0 + 1.2, 2)
    const r2 = Math.hypot(0 - 1.2, 2)
    expect(V).toBeCloseTo(2 / r1 + -1.5 / r2, 5)
  })

  it('is higher near positive charge', () => {
    const charges = [
      { x: -1.2, y: 0, Q: 2 },
      { x: 1.2, y: 0, Q: -1.5 },
    ]
    const nearPos = potentialAt(charges, -1.2, 0.8)
    const nearNeg = potentialAt(charges, 1.2, 0.8)
    expect(nearPos).toBeGreaterThan(nearNeg)
  })

  it('exposes V and uses tMax', () => {
    const m = createPotentialModel()
    m.init({ Q1: 2, Q2: -1.5, d: 2.4, R: 2.2 })
    m.seek?.(2)
    const snap = m.observe()
    expect(typeof snap.values.V).toBe('number')
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, potentialMeta)).toBeCloseTo(8, 5)
  })
})
