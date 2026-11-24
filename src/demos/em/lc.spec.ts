import { describe, expect, it } from 'vitest'
import { createLcModel, lcMeta, lcOmega0 } from './lc'
import { resolveTMax } from '@/core/physics/types'

describe('LC', () => {
  it('omega0 = 1/sqrt(LC)', () => {
    expect(lcOmega0(1, 1)).toBeCloseTo(1, 6)
    expect(lcOmega0(4, 1)).toBeCloseTo(0.5, 6)
  })

  it('energy roughly conserved', () => {
    const m = createLcModel()
    m.init({ L: 1, C: 1 })
    m.seek(0)
    const E0 = Number(m.observe().values.E)
    m.seek(1.5)
    const E1 = Number(m.observe().values.E)
    expect(Math.abs(E1 - E0)).toBeLessThan(0.05)
  })

  it('uses tMax', () => {
    const m = createLcModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, lcMeta)).toBeCloseTo(10, 5)
  })
})
