import { describe, expect, it } from 'vitest'
import { createDampedModel, dampedMeta } from './damped'
import { resolveTMax } from '@/core/physics/types'

describe('damped oscillator', () => {
  it('starts at A0 when φ=0 and envelope decays', () => {
    const m = createDampedModel()
    m.init({ A0: 1.5, omega0: 3, gamma: 0.4, phi: 0 })
    expect(Number(m.observe().values.x)).toBeCloseTo(1.5, 5)
    m.seek?.(2)
    const snap = m.observe()
    expect(Number(snap.values.envelope)).toBeCloseTo(1.5 * Math.exp(-0.4 * 2), 4)
    expect(Math.abs(Number(snap.values.x))).toBeLessThanOrEqual(
      Number(snap.values.envelope) + 1e-6,
    )
  })

  it('omegaD = sqrt(omega0^2 - gamma^2)', () => {
    const m = createDampedModel()
    m.init({ A0: 1, omega0: 4, gamma: 1, phi: 0 })
    const wd = Number(m.observe().values.omegaD)
    expect(wd).toBeCloseTo(Math.sqrt(16 - 1), 5)
  })

  it('uses tMax protocol', () => {
    const m = createDampedModel()
    m.init({ A0: 1, omega0: 2.5, gamma: 0.3, phi: 0 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, dampedMeta)).toBe(Number(live.tMax))
    expect(live.tMax).toBeGreaterThan(0)
  })
})
