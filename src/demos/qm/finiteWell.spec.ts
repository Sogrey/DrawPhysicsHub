import { describe, expect, it } from 'vitest'
import { createFiniteWellModel, finiteLevels, finiteWellMeta } from './finiteWell'
import { resolveTMax } from '@/core/physics/types'
describe('Finite well', () => {
  it('deeper well more levels', () => { expect(finiteLevels(20).length).toBeGreaterThanOrEqual(finiteLevels(4).length) })
  it('uses tMax', () => {
    const m=createFiniteWellModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,finiteWellMeta)).toBeCloseTo(8,5)
  })
})
