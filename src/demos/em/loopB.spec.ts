import { describe, expect, it } from 'vitest'
import {
  createLoopBModel,
  loopBAt,
  loopBAxis,
  loopBMeta,
} from './loopB'
import { resolveTMax } from '@/core/physics/types'

describe('current loop B field', () => {
  it('gives B(0) = I/a on axis', () => {
    expect(loopBAxis(2, 1.4, 0)).toBeCloseTo(2 / 1.4, 5)
  })

  it('matches Biot-Savart on axis', () => {
    const I = 2
    const a = 1.4
    for (const x of [0, 0.8, 2.0]) {
      const [Bx] = loopBAt(I, a, x, 0, 96)
      expect(Bx).toBeCloseTo(loopBAxis(I, a, x), 2)
    }
  })

  it('decays away from center', () => {
    expect(Math.abs(loopBAxis(2, 1.4, 3))).toBeLessThan(Math.abs(loopBAxis(2, 1.4, 0)))
  })

  it('uses tMax protocol', () => {
    const m = createLoopBModel()
    m.init({ I: 2, a: 1.4 })
    const snap = m.observe()
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, loopBMeta)).toBeCloseTo(8, 5)
  })
})
