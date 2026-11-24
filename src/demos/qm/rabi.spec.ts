import { describe, expect, it } from 'vitest'
import { createRabiModel, rabiExcitedProb, rabiMeta } from './rabi'
import { resolveTMax } from '@/core/physics/types'

describe('Rabi', () => {
  it('starts in ground state', () => {
    expect(rabiExcitedProb(2, 0)).toBeCloseTo(0, 8)
  })

  it('reaches 1 at pi pulse', () => {
    // Ωt/2 = π/2 ⇒ t = π/Ω
    expect(rabiExcitedProb(2, Math.PI / 2)).toBeCloseTo(1, 5)
  })

  it('uses tMax', () => {
    const m = createRabiModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, rabiMeta)).toBeCloseTo(8, 5)
  })
})
