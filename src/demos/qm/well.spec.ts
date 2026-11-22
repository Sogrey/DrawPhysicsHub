import { describe, expect, it } from 'vitest'
import { createWellModel, wellEnergy, wellMeta, wellPsi } from './well'
import { resolveTMax } from '@/core/physics/types'

describe('infinite square well', () => {
  it('vanishes at boundaries', () => {
    expect(wellPsi(1, 4, 0)).toBeCloseTo(0, 10)
    expect(wellPsi(1, 4, 4)).toBeCloseTo(0, 10)
  })

  it('has energy E = n² π² / (2 L²)', () => {
    expect(wellEnergy(1, 4)).toBeCloseTo((Math.PI * Math.PI) / (2 * 16), 5)
    expect(wellEnergy(2, 4)).toBeCloseTo(4 * wellEnergy(1, 4), 5)
  })

  it('keeps |ψ|² independent of time', () => {
    const m = createWellModel()
    m.init({ n: 2, L: 4 })
    m.seek?.(0)
    const a = m.observe().values.dens as Float32Array
    m.seek?.(3)
    const b = m.observe().values.dens as Float32Array
    for (let i = 0; i < a.length; i++) expect(b[i]).toBeCloseTo(a[i]!, 5)
  })

  it('sets Re=ψ cosφ and Im=−ψ sinφ', () => {
    const m = createWellModel()
    m.init({ n: 1, L: 4 })
    m.seek?.(2)
    const o = m.observe().values
    const phase = Number(o.phase)
    const psi = o.psi as Float32Array
    const re = o.re as Float32Array
    const im = o.im as Float32Array
    const mid = Math.floor(psi.length / 2)
    expect(re[mid]!).toBeCloseTo(psi[mid]! * Math.cos(phase), 5)
    expect(im[mid]!).toBeCloseTo(-psi[mid]! * Math.sin(phase), 5)
  })

  it('uses tMax', () => {
    const m = createWellModel()
    m.init({ n: 1, L: 4 })
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, wellMeta)).toBeCloseTo(8, 5)
  })
})
