import { describe, expect, it } from 'vitest'
import { createWaveModesModel, stringMode, waveModesMeta } from './waveModes'
import { resolveTMax } from '@/core/physics/types'

describe('Wave modes', () => {
  it('ends fixed', () => {
    expect(stringMode(0, 6, 2, 0.3, 1, 1)).toBeCloseTo(0, 8)
    expect(stringMode(6, 6, 2, 0.3, 1, 1)).toBeCloseTo(0, 8)
  })

  it('nodes = n-1', () => {
    const m = createWaveModesModel()
    m.init({ n: 4 })
    expect(Number(m.observe().values.nodes)).toBe(3)
  })

  it('uses tMax', () => {
    const m = createWaveModesModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, waveModesMeta)).toBeCloseTo(8, 5)
  })
})
