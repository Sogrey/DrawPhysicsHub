/** Classical RK4 stepper (M1-07) */

export type State = Float64Array | number[]

export type DerivFn = (t: number, y: State, out: Float64Array) => void

function ensureOut(n: number, buf?: Float64Array): Float64Array {
  return buf && buf.length === n ? buf : new Float64Array(n)
}

/**
 * Advance state `y` by one RK4 step of size `dt`.
 * Mutates `y` in place. Returns the same array reference.
 */
export function rk4Step(
  f: DerivFn,
  t: number,
  y: State,
  dt: number,
  scratch?: { k1?: Float64Array; k2?: Float64Array; k3?: Float64Array; k4?: Float64Array; yt?: Float64Array },
): State {
  const n = y.length
  const k1 = ensureOut(n, scratch?.k1)
  const k2 = ensureOut(n, scratch?.k2)
  const k3 = ensureOut(n, scratch?.k3)
  const k4 = ensureOut(n, scratch?.k4)
  const yt = ensureOut(n, scratch?.yt)

  f(t, y, k1)

  for (let i = 0; i < n; i++) yt[i] = y[i] + 0.5 * dt * k1[i]
  f(t + 0.5 * dt, yt, k2)

  for (let i = 0; i < n; i++) yt[i] = y[i] + 0.5 * dt * k2[i]
  f(t + 0.5 * dt, yt, k3)

  for (let i = 0; i < n; i++) yt[i] = y[i] + dt * k3[i]
  f(t + dt, yt, k4)

  for (let i = 0; i < n; i++) {
    y[i] = y[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
  }
  return y
}
