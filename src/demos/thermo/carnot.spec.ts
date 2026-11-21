import { describe, expect, it } from 'vitest'
import {
  carnotCorners,
  carnotStateAt,
  createCarnotModel,
  carnotMeta,
} from './carnot'
import { resolveTMax } from '@/core/physics/types'

describe('Carnot cycle', () => {
  it('gives eta = 1 - Tc/Th', () => {
    const s = carnotStateAt(0, 3, 1.2, 1, 2, 1.4)
    expect(s.eta).toBeCloseTo(1 - 1.2 / 3, 5)
  })

  it('has four corners with Th then Tc', () => {
    const c = carnotCorners(3, 1.2, 1, 2, 1.4)
    expect(c[0]!.T).toBeCloseTo(3, 5)
    expect(c[1]!.T).toBeCloseTo(3, 5)
    expect(c[2]!.T).toBeCloseTo(1.2, 5)
    expect(c[3]!.T).toBeCloseTo(1.2, 5)
    expect(c[1]!.V).toBeGreaterThan(c[0]!.V)
  })

  it('keeps T≈Th on isothermal expansion segment', () => {
    const s = carnotStateAt(0.5, 3, 1.2, 1, 2, 1.4)
    expect(s.stage).toBe(0)
    expect(s.T).toBeCloseTo(3, 5)
  })

  it('uses tMax protocol', () => {
    const m = createCarnotModel()
    m.init({ Th: 3, Tc: 1.2 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, carnotMeta)).toBeCloseTo(12, 5)
  })
})
