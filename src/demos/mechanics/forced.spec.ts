import { describe, expect, it } from 'vitest'
import { createForcedModel, forcedMeta } from './forced'
import { resolveTMax } from '@/core/physics/types'

describe('forced oscillator', () => {
  it('steady amplitude matches analytic formula', () => {
    const omega0 = 3
    const omega = 2
    const gamma = 0.25
    const F0 = 1.2
    const m = createForcedModel()
    m.init({ omega0, omega, gamma, F0 })
    const Ass = Number(m.observe().values.Ass)
    const detune = omega0 * omega0 - omega * omega
    const dampTerm = 2 * gamma * omega
    const expectA = F0 / Math.sqrt(detune * detune + dampTerm * dampTerm)
    expect(Ass).toBeCloseTo(expectA, 5)
  })

  it('phase lag is ~π/2 near ω=ω₀ for light damping', () => {
    const m = createForcedModel()
    m.init({ omega0: 3, omega: 3, gamma: 0.2, F0: 1 })
    const deltaDeg = Number(m.observe().values.delta)
    expect(deltaDeg).toBeCloseTo(90, 0)
  })

  it('omegaR = sqrt(omega0^2 - 2 gamma^2)', () => {
    const m = createForcedModel()
    m.init({ omega0: 4, omega: 2, gamma: 0.5, F0: 1 })
    expect(Number(m.observe().values.omegaR)).toBeCloseTo(Math.sqrt(16 - 0.5), 5)
  })

  it('uses tMax protocol', () => {
    const m = createForcedModel()
    m.init({ omega0: 3, omega: 2, gamma: 0.25, F0: 1.2 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, forcedMeta)).toBe(Number(live.tMax))
    expect(live.tMax).toBeGreaterThan(0)
  })
})
