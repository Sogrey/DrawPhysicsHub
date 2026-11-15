import { describe, expect, it } from 'vitest'
import { buildPedagogyContext, evalChallengeCheck, formatBinding } from './pedagogy'

describe('pedagogy helpers', () => {
  it('merges params and live without demo-specific formulas', () => {
    const ctx = buildPedagogyContext({ A: 2, omega: 3 }, { x: 1.5, v0x: 9 })
    expect(ctx.A).toBe(2)
    expect(ctx.omega).toBe(3)
    expect(ctx.x).toBe(1.5)
    expect(ctx.v0x).toBe(9)
    expect(ctx.v0y).toBeUndefined()
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
