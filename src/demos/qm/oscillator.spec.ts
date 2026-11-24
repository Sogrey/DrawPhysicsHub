import { describe, expect, it } from 'vitest'
import {
  createOscillatorModel,
  hermite,
  oscillatorEnergy,
  oscillatorMeta,
  oscillatorPsi,
} from './oscillator'
import { resolveTMax } from '@/core/physics/types'

describe('Quantum harmonic oscillator', () => {
  it('energies are ω(n+1/2)', () => {
    expect(oscillatorEnergy(0, 1)).toBeCloseTo(0.5, 8)
    expect(oscillatorEnergy(1, 1)).toBeCloseTo(1.5, 8)
    expect(oscillatorEnergy(2, 2)).toBeCloseTo(5, 8)
  })

  it('Hermite recurrence basics', () => {
    expect(hermite(0, 0.3)).toBeCloseTo(1, 8)
    expect(hermite(1, 0.3)).toBeCloseTo(0.6, 8)
    expect(hermite(2, 0.3)).toBeCloseTo(4 * 0.09 - 2, 6)
  })

  it('ground state peaks at x=0', () => {
    const a0 = Math.abs(oscillatorPsi(0, 1, 0))
    expect(Math.abs(oscillatorPsi(0, 1, 1))).toBeLessThan(a0)
  })

  it('uses tMax protocol', () => {
    const m = createOscillatorModel()
    m.init({ n: 1, omega: 1 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, oscillatorMeta)).toBeCloseTo(8, 5)
  })
})
