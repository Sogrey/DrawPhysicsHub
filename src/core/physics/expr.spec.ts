import { describe, expect, it } from 'vitest'
import { evalExpr } from './expr'

describe('evalExpr', () => {
  it('evaluates arithmetic', () => {
    expect(evalExpr('1+2*3')).toBe(7)
    expect(evalExpr('(1+2)*3')).toBe(9)
    expect(evalExpr('2^3')).toBe(8)
  })

  it('supports env variables and functions', () => {
    expect(evalExpr('sin(theta)', { theta: 0 })).toBeCloseTo(0, 10)
    expect(evalExpr('v0*cos(theta)', { v0: 10, theta: 0 })).toBeCloseTo(10, 10)
  })

  it('rejects unknown identifiers', () => {
    expect(() => evalExpr('alert(1)')).toThrow()
    expect(() => evalExpr('foo+1')).toThrow()
  })
})
