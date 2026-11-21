import { describe, expect, it } from 'vitest'
import { createNaturalFrameModel, naturalFrameMeta } from './naturalFrame'
import { resolveTMax } from '@/core/physics/types'

describe('natural frame (ellipse)', () => {
  it('satisfies aₙ · ρ ≈ v² when aₙ > 0', () => {
    const m = createNaturalFrameModel()
    m.init({ A: 3, B: 1.8, omega: 1.2 })
    m.seek?.(0.55)
    const snap = m.observe()
    const speed = Number(snap.values.speed)
    const an = Number(snap.values.an)
    const rho = Number(snap.values.rho)
    expect(an).toBeGreaterThan(0.2)
    expect(rho).toBeGreaterThan(0.2)
    expect(an * rho).toBeCloseTo(speed * speed, 4)
    expect(Number(snap.values.residual)).toBeCloseTo(0, 4)
  })

  it('has aₜ ≈ 0 on a circle (A = B)', () => {
    const m = createNaturalFrameModel()
    m.init({ A: 2, B: 2, omega: 1.5 })
    for (const ti of [0.2, 0.8, 1.4, 2.0]) {
      m.seek?.(ti)
      const snap = m.observe()
      expect(Math.abs(Number(snap.values.at))).toBeLessThan(1e-6)
      expect(Number(snap.values.an)).toBeCloseTo(1.5 * 1.5 * 2, 5)
      expect(Number(snap.values.rho)).toBeCloseTo(2, 5)
    }
  })

  it('ê_t aligns with velocity', () => {
    const m = createNaturalFrameModel()
    m.init({ A: 3, B: 1.5, omega: 1 })
    m.seek?.(0.4)
    const snap = m.observe()
    const vx = Number(snap.values.vx)
    const vy = Number(snap.values.vy)
    const speed = Number(snap.values.speed)
    expect(Number(snap.values.etx)).toBeCloseTo(vx / speed, 5)
    expect(Number(snap.values.ety)).toBeCloseTo(vy / speed, 5)
    // ê_n ⊥ ê_t
    expect(
      Number(snap.values.etx) * Number(snap.values.enx) +
        Number(snap.values.ety) * Number(snap.values.eny),
    ).toBeCloseTo(0, 5)
  })

  it('uses tMax protocol', () => {
    const m = createNaturalFrameModel()
    m.init({ A: 3, B: 2, omega: 1 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, naturalFrameMeta)).toBeCloseTo(2 * Math.PI, 5)
  })
})
