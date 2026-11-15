import { describe, expect, it } from 'vitest'
import { createCircularModel, circularMeta } from './circular'
import { resolveTMax } from '@/core/physics/types'

describe('circular motion', () => {
  it('keeps |v| = ωR and aₙ = ω²R', () => {
    const m = createCircularModel()
    m.init({ R: 2, omega: 1.5 })
    m.seek?.(0.7)
    const snap = m.observe()
    expect(Number(snap.values.speed)).toBeCloseTo(2 * 1.5, 5)
    expect(Number(snap.values.an)).toBeCloseTo(1.5 * 1.5 * 2, 5)
    expect(Math.hypot(Number(snap.values.x), Number(snap.values.y))).toBeCloseTo(2, 5)
  })

  it('completes one period back near start', () => {
    const m = createCircularModel()
    m.init({ R: 1.5, omega: 2 })
    const T = Number(m.observe().values.tMax)
    m.seek?.(T)
    const snap = m.observe()
    expect(Number(snap.values.x)).toBeCloseTo(1.5, 4)
    expect(Number(snap.values.y)).toBeCloseTo(0, 4)
    expect(Number(snap.values.done)).toBe(1)
  })

  it('uses tMax protocol', () => {
    const m = createCircularModel()
    m.init({ R: 2, omega: 1 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, circularMeta)).toBeCloseTo(2 * Math.PI, 5)
  })
})
