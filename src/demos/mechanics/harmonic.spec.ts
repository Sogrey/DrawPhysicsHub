import { describe, expect, it } from 'vitest'
import { createHarmonicModel, harmonicMeta } from './harmonic'
import { buildPedagogyContext, challengeStatus } from '@/core/physics/pedagogy'
import { resolveTMax } from '@/core/physics/types'

describe('harmonic model', () => {
  it('completes one period and reports tMax = 2π/ω', () => {
    const m = createHarmonicModel()
    m.init({ A: 1, omega: 2, phi: 0 })
    const expectT = Math.PI
    expect(Number(m.observe().values.tMax)).toBeCloseTo(expectT, 5)
    for (let i = 0; i < 5000; i++) {
      m.step(0.002)
      if (m.observe().values.done === 1) break
    }
    const snap = m.observe()
    expect(snap.time).toBeCloseTo(expectT, 2)
    expect(Number(snap.values.x)).toBeCloseTo(1, 1)
  })

  it('seek to quarter period gives x≈0 when φ=0', () => {
    const m = createHarmonicModel()
    m.init({ A: 1.5, omega: 2, phi: 0 })
    const T = Number(m.observe().values.tMax)
    m.seek?.(T / 4)
    const snap = m.observe()
    expect(Number(snap.values.x)).toBeCloseTo(0, 1)
    expect(Math.abs(Number(snap.values.vx))).toBeGreaterThan(1)
  })
})

describe('harmonic protocol', () => {
  it('resolveTMax uses meta.time.maxKey', () => {
    const live = { tMax: 3.14, flightTime: 99 }
    expect(resolveTMax(live, harmonicMeta)).toBeCloseTo(3.14, 5)
  })

  it('pedagogy merges observe-derived values only', () => {
    const m = createHarmonicModel()
    m.init({ A: 2, omega: Math.PI, phi: 0 })
    const snap = m.observe()
    const live: Record<string, number> = { t: snap.time }
    for (const [k, v] of Object.entries(snap.values)) {
      if (typeof v === 'number') live[k] = v
    }
    const ctx = buildPedagogyContext({ A: 2, omega: Math.PI }, live)
    expect(ctx.period).toBeCloseTo(2, 5)
    const ch = harmonicMeta.docs.challenges!.find((c) => c.id === 'period-pi')!
    expect(challengeStatus(ch, ctx)).toBe('pass')
  })
})
