import { describe, expect, it } from 'vitest'
import { createFourierModel, fourierMeta, squarePartial } from './fourier'
import { resolveTMax } from '@/core/physics/types'

describe('Fourier', () => {
  it('more terms closer at π/2', () => {
    const a = Math.abs(squarePartial(Math.PI / 2, 3) - 1)
    const b = Math.abs(squarePartial(Math.PI / 2, 21) - 1)
    expect(b).toBeLessThan(a)
  })

  it('N increases while playing', () => {
    const m = createFourierModel()
    m.init({ nTerms: 1 })
    m.seek?.(8)
    expect(Number(m.observe().values.nTerms)).toBeGreaterThan(10)
  })

  it('uses tMax', () => {
    const m = createFourierModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, fourierMeta)).toBeCloseTo(10, 5)
  })
})
