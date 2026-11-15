import { describe, expect, it } from 'vitest'
import { createProjectileModel, projectileMeta } from './projectile'
import { buildPedagogyContext, challengeStatus, formatBinding } from '@/core/physics/pedagogy'

describe('projectile model', () => {
  it('lands near analytic range at 45°', () => {
    const m = createProjectileModel()
    m.init({ v0: 20, angle: 45 })
    const g = 9.8
    const expectRange = (20 * 20) / g
    for (let i = 0; i < 5000; i++) {
      m.step(0.002)
      if (m.observe().values.done === 1) break
    }
    const snap = m.observe()
    expect(Number(snap.values.x)).toBeCloseTo(expectRange, 1)
    expect(Number(snap.values.y)).toBeCloseTo(0, 1)
  })

  it('seek jumps to apex with vy ≈ 0', () => {
    const m = createProjectileModel()
    m.init({ v0: 20, angle: 45 })
    const tmax = Number(m.observe().values.tmax)
    m.seek?.(tmax)
    const snap = m.observe()
    expect(snap.time).toBeCloseTo(tmax, 3)
    expect(Number(snap.values.vy)).toBeCloseTo(0, 1)
    expect(Number(snap.values.y)).toBeCloseTo(Number(snap.values.hmax), 1)
  })
})

describe('projectile pedagogy', () => {
  it('formats live bindings from context', () => {
    const ctx = buildPedagogyContext({ v0: 20, angle: 45 }, { t: 0, x: 0, y: 0, range: 0, hmax: 10.2 })
    const tex = formatBinding({ labelTex: 'v_{0x}', valueKey: 'v0x', unit: 'm/s' }, ctx)
    expect(tex).toContain('14.14')
  })

  it('passes max-range challenge near 45°', () => {
    const challenge = projectileMeta.docs.challenges!.find((c) => c.id === 'max-range')!
    const pass = challengeStatus(challenge, buildPedagogyContext({ v0: 20, angle: 45 }, {}))
    const fail = challengeStatus(challenge, buildPedagogyContext({ v0: 20, angle: 30 }, {}))
    expect(pass).toBe('pass')
    expect(fail).toBe('pending')
  })

  it('passes height challenge near H=5', () => {
    const challenge = projectileMeta.docs.challenges!.find((c) => c.id === 'height-5')!
    const pass = challengeStatus(challenge, buildPedagogyContext({}, { hmax: 5.1 }))
    expect(pass).toBe('pass')
  })
})
