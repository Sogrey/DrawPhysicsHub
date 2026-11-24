import { describe, expect, it } from 'vitest'
import { conductionMeta, createConductionModel } from './conduction'
import { resolveTMax } from '@/core/physics/types'
describe('Conduction', () => {
  it('mid moves toward 0.5', () => {
    const m=createConductionModel(); m.init({kappa:2}); m.seek?.(0.2); const a=Number(m.observe().values.Tmid); m.seek?.(4); expect(Number(m.observe().values.Tmid)).toBeGreaterThan(a-0.01)
  })
  it('uses tMax', () => {
    const m=createConductionModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,conductionMeta)).toBeCloseTo(8,5)
  })
})
