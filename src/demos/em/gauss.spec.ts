import { describe, expect, it } from 'vitest'
import { createGaussModel, fluxSphere, gaussMeta } from './gauss'
import { resolveTMax } from '@/core/physics/types'
describe('Gauss', () => {
  it('flux = Q', () => { expect(fluxSphere(2)).toBeCloseTo(2,8) })
  it('uses tMax', () => {
    const m=createGaussModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,gaussMeta)).toBeCloseTo(8,5)
  })
})
