import { describe, expect, it } from 'vitest'
import { ampereForce, createAmpereModel, ampereMeta } from './ampere'
import { resolveTMax } from '@/core/physics/types'

describe('Ampere force', () => {
  it('gives |F|=|I|L|B| when I along x, B along z', () => {
    const f = ampereForce(2, 2.4, 1.2, 0)
    expect(f.Fmag).toBeCloseTo(2 * 2.4 * 1.2, 5)
    expect(f.Fx).toBeCloseTo(0, 5)
    expect(f.Fy).toBeCloseTo(-2 * 2.4 * 1.2, 5)
  })

  it('reverses when I reverses', () => {
    const a = ampereForce(2, 2, 1, 0)
    const b = ampereForce(-2, 2, 1, 0)
    expect(b.Fx).toBeCloseTo(-a.Fx, 5)
    expect(b.Fy).toBeCloseTo(-a.Fy, 5)
  })

  it('rotates F when wire angle changes', () => {
    const f = ampereForce(1, 1, 1, 90)
    // L along +y, F = I L B (1, 0) roughly → Fx > 0
    expect(f.Fx).toBeCloseTo(1, 5)
    expect(Math.abs(f.Fy)).toBeLessThan(1e-9)
  })

  it('uses tMax and sweeps I', () => {
    const m = createAmpereModel()
    m.init({ Imax: 2, L: 2.4, B: 1.2, alpha: 0 })
    m.seek?.(0)
    const a = m.observe()
    m.seek?.(8)
    const b = m.observe()
    expect(Number(a.values.I)).toBeCloseTo(-2, 5)
    expect(Number(b.values.I)).toBeCloseTo(2, 5)
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(a.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, ampereMeta)).toBeCloseTo(8, 5)
  })
})
