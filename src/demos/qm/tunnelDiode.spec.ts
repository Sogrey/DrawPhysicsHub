import { describe, expect, it } from 'vitest'
import { createTunnelDiodeModel, tunnelCurrent, tunnelDiodeMeta } from './tunnelDiode'
import { resolveTMax } from '@/core/physics/types'

describe('TunnelDiode', () => {
  it('has a peak then valley before diffusion rise', () => {
    let vmax = 0
    let imax = -1
    for (let v = 0; v <= 1; v += 0.05) {
      const i = tunnelCurrent(v)
      if (i > imax) {
        imax = i
        vmax = v
      }
    }
    expect(vmax).toBeGreaterThan(0.05)
    expect(vmax).toBeLessThan(0.8)
    expect(tunnelCurrent(vmax + 0.35)).toBeLessThan(imax)
  })

  it('uses tMax', () => {
    const m = createTunnelDiodeModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, tunnelDiodeMeta)).toBeCloseTo(8, 5)
  })
})
