import { describe, expect, it } from 'vitest'
import { createEulerAnglesModel, eulerAnglesMeta, eulerCompose } from './eulerAngles'
import { resolveTMax } from '@/core/physics/types'

describe('EulerAngles', () => {
  it('tip on unit sphere for theta', () => {
    const e = eulerCompose(0.3, 0.5, 1)
    expect(Math.hypot(e.tipX, e.tipY, e.tipZ)).toBeCloseTo(1, 6)
  })

  it('uses tMax', () => {
    const m = createEulerAnglesModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, eulerAnglesMeta)).toBeCloseTo(10, 5)
  })
})
