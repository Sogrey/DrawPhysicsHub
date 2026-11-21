import { describe, expect, it } from 'vitest'
import { createRotationAxisModel, rotationAxisMeta } from './rotationAxis'
import { resolveTMax } from '@/core/physics/types'

describe('fixed-axis rotation', () => {
  it('satisfies ω = ω₀ + αt and v = |ω|R', () => {
    const m = createRotationAxisModel()
    m.init({ R: 1.5, omega0: 1, alpha: 0.5, m: 2 })
    m.seek?.(1.2)
    const snap = m.observe()
    expect(Number(snap.values.omega)).toBeCloseTo(1 + 0.5 * 1.2, 5)
    expect(Number(snap.values.speed)).toBeCloseTo(Math.abs(Number(snap.values.omega)) * 1.5, 5)
    expect(Number(snap.values.checkV)).toBeCloseTo(0, 5)
  })

  it('gives τ = Iα for solid disk', () => {
    const m = createRotationAxisModel()
    m.init({ R: 2, omega0: 0.5, alpha: 0.5, m: 2 })
    const snap = m.observe()
    const I = 0.5 * 2 * 4
    expect(Number(snap.values.I)).toBeCloseTo(I, 5)
    expect(Number(snap.values.tau)).toBeCloseTo(I * 0.5, 5)
  })

  it('has aₜ = 0 when α = 0', () => {
    const m = createRotationAxisModel()
    m.init({ R: 1, omega0: 1.5, alpha: 0, m: 1 })
    m.seek?.(0.8)
    const snap = m.observe()
    expect(Number(snap.values.at)).toBeCloseTo(0, 6)
    expect(Number(snap.values.omega)).toBeCloseTo(1.5, 5)
  })

  it('uses tMax protocol', () => {
    const m = createRotationAxisModel()
    m.init({ R: 1.5, omega0: 1, alpha: 0, m: 2 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, rotationAxisMeta)).toBeCloseTo(4 * Math.PI, 5)
  })
})
