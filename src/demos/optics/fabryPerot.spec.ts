import { describe, expect, it } from 'vitest'
import { createFabryPerotModel, fabryI, fabryPerotMeta, finesse } from './fabryPerot'
import { resolveTMax } from '@/core/physics/types'
describe('Fabry-Perot', () => {
  it('peaks at delta=0', () => { expect(fabryI(0,0.8)).toBeCloseTo(1,5); expect(fabryI(Math.PI,0.8)).toBeLessThan(0.2) })
  it('finesse rises with R', () => { expect(finesse(0.9)).toBeGreaterThan(finesse(0.5)) })
  it('uses tMax', () => {
    const m=createFabryPerotModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,fabryPerotMeta)).toBeCloseTo(8,5)
  })
})
