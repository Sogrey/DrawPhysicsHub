import { describe, expect, it } from 'vitest'
import {
  birefringenceState,
  createBirefringenceModel,
  birefringenceMeta,
} from './birefringence'
import { resolveTMax } from '@/core/physics/types'

describe('birefringence o/e rays', () => {
  it('matches Snell for o and e', () => {
    const s = birefringenceState(40, 1.66, 1.49, 3.2, 35)
    const sI = Math.sin((40 * Math.PI) / 180)
    expect(1.66 * Math.sin((s.thetaO * Math.PI) / 180)).toBeCloseTo(sI, 4)
    expect(1.49 * Math.sin((s.thetaE * Math.PI) / 180)).toBeCloseTo(sI, 4)
  })

  it('gives larger |θe| when ne < no (negative uniaxial)', () => {
    const s = birefringenceState(40, 1.66, 1.49, 3.2, 35)
    expect(s.thetaE).toBeGreaterThan(s.thetaO)
    expect(s.deltaY).toBeGreaterThan(0)
    expect(s.uniaxial).toBe('negative')
  })

  it('collapses when no ≈ ne', () => {
    const s = birefringenceState(40, 1.5, 1.5, 3.2, 35)
    expect(Math.abs(s.deltaY)).toBeLessThan(1e-6)
    expect(s.uniaxial).toBe('iso')
  })

  it('uses tMax protocol', () => {
    const m = createBirefringenceModel()
    m.init({ nO: 1.66, nE: 1.49, L: 3.2 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, birefringenceMeta)).toBeCloseTo(8, 5)
  })
})
