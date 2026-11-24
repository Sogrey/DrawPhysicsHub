import { describe, expect, it } from 'vitest'
import { createMutualModel, mutualMeta } from './mutual'
import { resolveTMax } from '@/core/physics/types'
describe('Mutual', () => {
  it('Vs grows with M', () => {
    const m = createMutualModel(); m.init({M:0.5,Vp0:2,omega:2}); m.seek!(0.4)
    const a = Math.abs(Number(m.observe().values.Vs))
    m.setParams!({M:1.4}); m.seek!(0.4)
    expect(Math.abs(Number(m.observe().values.Vs))).toBeGreaterThan(a)
  })
  it('uses tMax', () => {
    const m=createMutualModel(); m.init({})
    const live:Record<string,number>={}
    for (const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,mutualMeta)).toBeCloseTo(8,5)
  })
})
