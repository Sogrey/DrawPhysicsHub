import { describe, expect, it } from 'vitest'
import { createEmWaveModel, emWaveFields, emWaveMeta } from './emWave'
import { resolveTMax } from '@/core/physics/types'

describe('EM wave', () => {
  it('E and B in phase', () => {
    const f = emWaveFields(1, 1, 1, 0.5, 0.2)
    expect(f.E).toBeCloseTo(f.B, 8)
  })

  it('c = λ/T', () => {
    const m = createEmWaveModel()
    m.init({ A: 1, lambda: 4, period: 2 })
    expect(Number(m.observe().values.c)).toBeCloseTo(2, 5)
  })

  it('uses tMax', () => {
    const m = createEmWaveModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, emWaveMeta)).toBeCloseTo(6, 5)
  })
})
