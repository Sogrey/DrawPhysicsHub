import { describe, expect, it } from 'vitest'
import { createPhasePortraitModel, phasePortraitMeta, vanderPolDeriv } from './phasePortrait'
import { resolveTMax } from '@/core/physics/types'

describe('PhasePortrait', () => {
  it('linear restoring at origin', () => {
    const d = vanderPolDeriv(0.1, 0, 1)
    expect(d.dx).toBeCloseTo(0, 8)
    expect(d.dv).toBeCloseTo(-0.1, 8)
  })

  it('uses tMax and stays bounded', () => {
    const m = createPhasePortraitModel()
    m.init({ mu: 1 })
    for (let i = 0; i < 200; i++) m.step(0.05)
    const snap = m.observe()
    expect(Math.abs(Number(snap.values.x))).toBeLessThan(5)
    expect(Math.abs(Number(snap.values.v))).toBeLessThan(8)
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, phasePortraitMeta)).toBeCloseTo(12, 5)
  })
})
