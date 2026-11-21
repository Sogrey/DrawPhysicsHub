import { describe, expect, it } from 'vitest'
import { createWireBModel, wireBMeta } from './wireB'
import { resolveTMax } from '@/core/physics/types'

describe('infinite wire B field', () => {
  it('gives |B| = |I|/R on the probe circle', () => {
    const m = createWireBModel()
    m.init({ I: 2, R: 2 })
    const snap = m.observe()
    expect(Number(snap.values.Bmag)).toBeCloseTo(1, 5)
    expect(Number(snap.values.BmagTheory)).toBeCloseTo(1, 5)
  })

  it('reverses tangential direction when I flips', () => {
    const m = createWireBModel()
    m.init({ I: 2, R: 2 })
    m.seek?.(0) // probe at (R,0); B should be +y for I>0
    let snap = m.observe()
    expect(Number(snap.values.Bx)).toBeCloseTo(0, 5)
    expect(Number(snap.values.By)).toBeGreaterThan(0)

    m.init({ I: -2, R: 2 })
    m.seek?.(0)
    snap = m.observe()
    expect(Number(snap.values.By)).toBeLessThan(0)
    expect(Number(snap.values.Bmag)).toBeCloseTo(1, 5)
  })

  it('scales as 1/R', () => {
    const m = createWireBModel()
    m.init({ I: 3, R: 1.5 })
    expect(Number(m.observe().values.Bmag)).toBeCloseTo(2, 5)
  })

  it('uses tMax protocol', () => {
    const m = createWireBModel()
    m.init({ I: 2, R: 2 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, wireBMeta)).toBeCloseTo(6, 5)
  })
})
