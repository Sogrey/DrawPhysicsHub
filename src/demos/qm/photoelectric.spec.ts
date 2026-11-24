import { describe, expect, it } from 'vitest'
import {
  createPhotoelectricModel,
  cutoffFreq,
  kmaxPhoto,
  photoelectricMeta,
} from './photoelectric'
import { resolveTMax } from '@/core/physics/types'

describe('Photoelectric effect', () => {
  it('Kmax = f - W above cutoff', () => {
    expect(kmaxPhoto(2.2, 1.5)).toBeCloseTo(0.7, 8)
    expect(kmaxPhoto(1.0, 1.5)).toBeCloseTo(0, 8)
  })

  it('cutoff frequency is W/h', () => {
    expect(cutoffFreq(1.5, 1)).toBeCloseTo(1.5, 8)
  })

  it('intensity does not change Kmax', () => {
    const m = createPhotoelectricModel()
    m.init({ f: 2.2, W: 1.5, I: 0.2 })
    const k1 = Number(m.observe().values.Kmax)
    m.setParams?.({ I: 0.9 })
    const k2 = Number(m.observe().values.Kmax)
    expect(k1).toBeCloseTo(k2, 8)
  })

  it('uses tMax protocol', () => {
    const m = createPhotoelectricModel()
    m.init({ f: 2.2, W: 1.5 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, photoelectricMeta)).toBeCloseTo(8, 5)
  })
})
