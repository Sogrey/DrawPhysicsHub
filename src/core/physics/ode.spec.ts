import { describe, expect, it } from 'vitest'
import { rk4Step } from './ode'

describe('rk4Step', () => {
  it('integrates dy/dt = -y toward exponential decay', () => {
    const y = new Float64Array([1])
    const f = (_t: number, state: ArrayLike<number>, out: Float64Array) => {
      out[0] = -state[0]!
    }
    const dt = 0.01
    let t = 0
    for (let i = 0; i < 100; i++) {
      rk4Step(f, t, y, dt)
      t += dt
    }
    // y(1) ≈ e^{-1}
    expect(y[0]!).toBeCloseTo(Math.exp(-1), 4)
  })

  it('integrates harmonic oscillator for one period approximately', () => {
    // y'' = -y → state [x, v]
    const y = new Float64Array([1, 0])
    const f = (_t: number, s: ArrayLike<number>, out: Float64Array) => {
      out[0] = s[1]!
      out[1] = -s[0]!
    }
    const dt = 0.001
    const T = 2 * Math.PI
    let t = 0
    while (t < T) {
      rk4Step(f, t, y, dt)
      t += dt
    }
    expect(y[0]!).toBeCloseTo(1, 2)
    expect(y[1]!).toBeCloseTo(0, 2)
  })
})
