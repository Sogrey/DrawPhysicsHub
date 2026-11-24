import { describe, expect, it } from 'vitest'
import {
  bohrEnergy,
  bohrMeta,
  bohrRadius,
  createBohrModel,
  spectralLambda,
  transitionEnergyEv,
} from './bohr'
import { resolveTMax } from '@/core/physics/types'

describe('Bohr', () => {
  it('ground state energy −13.6 eV', () => {
    expect(bohrEnergy(1)).toBeCloseTo(-13.6, 5)
  })

  it('radius scales as n²', () => {
    expect(bohrRadius(2)).toBe(4)
    expect(bohrRadius(3)).toBe(9)
  })

  it('Balmer 3→2 photon energy', () => {
    const dE = transitionEnergyEv(3, 2)
    expect(dE).toBeCloseTo(13.6 * (1 / 4 - 1 / 9), 4)
    expect(spectralLambda(3, 2)).toBeGreaterThan(0)
  })

  it('uses tMax', () => {
    const m = createBohrModel()
    m.init({ ni: 3, nf: 2 })
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, bohrMeta)).toBeCloseTo(8, 5)
    expect(live.dE!).toBeCloseTo(transitionEnergyEv(3, 2), 4)
  })
})
