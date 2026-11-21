import { describe, expect, it } from 'vitest'
import { createLensModel, lensMeta, thinLens } from './lens'
import { resolveTMax } from '@/core/physics/types'

describe('thin lens', () => {
  it('gives equal inverted image at u=2f', () => {
    const s = thinLens(4, 2)
    expect(s.v).toBeCloseTo(4, 5)
    expect(s.m).toBeCloseTo(-1, 5)
    expect(s.real).toBe(true)
    expect(s.caseCode).toBe(2)
  })

  it('obeys 1/u+1/v=1/f', () => {
    const s = thinLens(6, 2)
    expect(1 / s.u + 1 / s.v).toBeCloseTo(1 / s.f, 5)
    expect(s.v).toBeCloseTo(3, 5)
    expect(s.real).toBe(true)
  })

  it('virtual erect when u<f', () => {
    const s = thinLens(1, 2)
    expect(s.real).toBe(false)
    expect(s.v).toBeLessThan(0)
    expect(s.m).toBeGreaterThan(0)
  })

  it('model sweeps and exposes tMax', () => {
    const m = createLensModel()
    m.init({ f: 2, hObj: 1.2 })
    m.seek?.(0)
    const snap0 = m.observe()
    expect(Number(snap0.values.u)).toBeGreaterThan(2 * 2)
    expect(Number(snap0.values.real)).toBe(1)

    m.seek?.(10)
    const snap1 = m.observe()
    expect(Number(snap1.values.u)).toBeLessThan(2)
    expect(Number(snap1.values.real)).toBe(0)

    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap0.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, lensMeta)).toBeCloseTo(10, 5)
  })
})
