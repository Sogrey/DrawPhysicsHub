import { describe, expect, it } from 'vitest'
import { barrierMeta, barrierTransmission, createBarrierModel } from './barrier'
import { resolveTMax } from '@/core/physics/types'

describe('Barrier tunneling', () => {
  it('gives 0<T<1 for E<V0', () => {
    const T = barrierTransmission(1.2, 2, 1.2)
    expect(T).toBeGreaterThan(0.01)
    expect(T).toBeLessThan(1)
  })

  it('decreases when barrier widens', () => {
    const thin = barrierTransmission(1, 2, 0.6)
    const thick = barrierTransmission(1, 2, 2)
    expect(thick).toBeLessThan(thin)
  })

  it('approaches 1 for E≫V0', () => {
    expect(barrierTransmission(20, 2, 1)).toBeGreaterThan(0.95)
  })

  it('uses tMax protocol', () => {
    const m = createBarrierModel()
    m.init({ E: 1.2, V0: 2, a: 1.2 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, barrierMeta)).toBeCloseTo(8, 5)
  })
})
