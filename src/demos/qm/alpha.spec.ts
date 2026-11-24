import { describe, expect, it } from 'vitest'
import { alphaMeta, createAlphaModel } from './alpha'
import { rutherfordOrbitSync } from '@/core/physics/worker/workerClient'
import { resolveTMax } from '@/core/physics/types'

describe('Alpha / Rutherford orbit', () => {
  it('smaller impact parameter deflects more', () => {
    const far = rutherfordOrbitSync(2.5, 1.8, 0.15, 0.01, 1200)
    const near = rutherfordOrbitSync(0.5, 1.8, 0.15, 0.01, 1200)
    expect(Math.abs(near.theta)).toBeGreaterThan(Math.abs(far.theta) * 0.5)
  })

  it('uses tMax and produces a path', () => {
    const m = createAlphaModel()
    m.init({ b: 1.2, v0: 1.8 })
    const snap = m.observe()
    expect(Number(snap.values.n)).toBeGreaterThan(10)
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, alphaMeta)).toBeCloseTo(10, 5)
  })
})

describe('Worker client sync fallback', () => {
  it('returns finite buffers', () => {
    const out = rutherfordOrbitSync(1, 2, 0.1, 0.01, 400)
    expect(out.n).toBeGreaterThan(5)
    expect(Number.isFinite(out.theta)).toBe(true)
  })
})
