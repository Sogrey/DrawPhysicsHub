import { describe, expect, it } from 'vitest'
import { createFresnelZoneModel, fresnelZoneMeta, zoneRadius } from './fresnelZone'
import { resolveTMax } from '@/core/physics/types'

describe('FresnelZone', () => {
  it('radius scales as sqrt(m)', () => {
    expect(zoneRadius(4, 1, 1) / zoneRadius(1, 1, 1)).toBeCloseTo(2, 6)
  })

  it('uses tMax', () => {
    const m = createFresnelZoneModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, fresnelZoneMeta)).toBeCloseTo(8, 5)
  })
})
