import { describe, expect, it } from 'vitest'
import { abbeLimit, abbeMeta, createAbbeModel } from './abbe'
import { resolveTMax } from '@/core/physics/types'

describe('Abbe', () => {
  it('limit halves when NA doubles', () => {
    expect(abbeLimit(1, 1) / abbeLimit(1, 2)).toBeCloseTo(2, 6)
  })

  it('uses tMax', () => {
    const m = createAbbeModel()
    m.init({})
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) if (typeof v === 'number') live[k] = v
    expect(resolveTMax(live, abbeMeta)).toBeCloseTo(8, 5)
  })
})
