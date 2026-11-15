import { describe, expect, it } from 'vitest'
import { buildPedagogyContext, evalChallengeCheck, formatBinding } from './pedagogy'

describe('pedagogy helpers', () => {
  it('builds v0x/v0y from params', () => {
    const ctx = buildPedagogyContext({ v0: 10, angle: 30 }, {})
    expect(ctx.v0x).toBeCloseTo(10 * Math.cos(Math.PI / 6), 5)
    expect(ctx.v0y).toBeCloseTo(10 * Math.sin(Math.PI / 6), 5)
  })

  it('evaluates nested all checks', () => {
    const ok = evalChallengeCheck(
      {
        kind: 'all',
        checks: [
          { kind: 'paramNear', key: 'angle', target: 45, tol: 1 },
          { kind: 'valueNear', key: 'hmax', target: 10, tol: 0.5 },
        ],
      },
      { angle: 45, hmax: 10.2 },
    )
    expect(ok).toBe(true)
  })

  it('formats binding with unit', () => {
    const tex = formatBinding(
      { labelTex: 'R', valueKey: 'range', unit: 'm', digits: 1 },
      { range: 40.82 },
    )
    expect(tex).toBe('R = 40.8\\,\\mathrm{m}')
  })
})
