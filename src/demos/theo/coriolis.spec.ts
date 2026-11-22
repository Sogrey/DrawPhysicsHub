import { describe, expect, it } from 'vitest'
import {
  coriolisAccel,
  createCoriolisModel,
  coriolisMeta,
} from './coriolis'
import { resolveTMax } from '@/core/physics/types'

describe('Coriolis', () => {
  it('gives a = (0, -2Ωv) when v along +x', () => {
    const a = coriolisAccel(1.2, 0, 0, 2, 0, false)
    expect(a.acx).toBeCloseTo(0, 5)
    expect(a.acy).toBeCloseTo(-2 * 1.2 * 2, 5)
  })

  it('deflects toward -y for Omega>0', () => {
    const m = createCoriolisModel()
    m.init({ Omega: 0.9, v0: 1.6, withCf: 0 })
    m.seek?.(1.5)
    expect(Number(m.observe().values.y)).toBeLessThan(0)
  })

  it('uses tMax', () => {
    const m = createCoriolisModel()
    m.init({ Omega: 0.9, v0: 1.6 })
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, coriolisMeta)).toBeCloseTo(5, 5)
  })
})
