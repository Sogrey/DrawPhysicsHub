import { describe, expect, it } from 'vitest'
import { comptonMeta, comptonShift, createComptonModel } from './compton'
import { resolveTMax } from '@/core/physics/types'

describe('Compton scattering', () => {
  it('shift is 0 at 0° and 2λc at 180°', () => {
    expect(comptonShift(0)).toBeCloseTo(0, 8)
    expect(comptonShift(180)).toBeCloseTo(2, 8)
    expect(comptonShift(90)).toBeCloseTo(1, 8)
  })

  it('uses tMax', () => {
    const m = createComptonModel()
    m.init({ theta: 60, lambda: 2 })
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, comptonMeta)).toBeCloseTo(6, 5)
  })
})
