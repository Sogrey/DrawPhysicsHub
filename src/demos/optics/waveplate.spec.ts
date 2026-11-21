import { describe, expect, it } from 'vitest'
import {
  applyWaveplate,
  classifyPolarization,
  createWaveplateModel,
  waveplateMeta,
} from './waveplate'
import { resolveTMax } from '@/core/physics/types'

describe('wave plate / polarization', () => {
  it('quarter-wave at 45° → circular', () => {
    const { jx, jy } = applyWaveplate(45, 0, 90)
    const pol = classifyPolarization(jx, jy)
    expect(pol.kind).toBe('circular')
    expect(pol.ellipticity).toBeGreaterThan(0.9)
    expect(Math.abs(Math.abs(pol.dphi) - Math.PI / 2)).toBeLessThan(0.15)
  })

  it('half-wave rotates linear plane: α=0, β=45 → vertical', () => {
    const { jx, jy } = applyWaveplate(0, 45, 180)
    const pol = classifyPolarization(jx, jy)
    expect(pol.kind).toBe('linear')
    expect(pol.Ay).toBeGreaterThan(0.9)
    expect(pol.Ax).toBeLessThan(0.15)
  })

  it('aligned axes stay linear', () => {
    const { jx, jy } = applyWaveplate(0, 0, 90)
    expect(classifyPolarization(jx, jy).kind).toBe('linear')
  })

  it('model observes circular defaults and tMax', () => {
    const m = createWaveplateModel()
    m.init({ plate: 'quarter', alpha: 45, beta: 0, delta: 90 })
    m.seek?.(0)
    const snap = m.observe()
    expect(Number(snap.values.kindCode)).toBe(2)
    expect(Number(snap.values.ellipticity)).toBeGreaterThan(0.9)
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, waveplateMeta)).toBeCloseTo(4, 5)
  })

  it('custom δ via plate=custom', () => {
    const m = createWaveplateModel()
    m.init({ plate: 'custom', alpha: 45, beta: 0, delta: 60 })
    const snap = m.observe()
    expect(Number(snap.values.delta)).toBeCloseTo(60, 5)
    expect(Number(snap.values.kindCode)).toBe(1) // elliptical
  })
})
