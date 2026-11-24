import { describe, expect, it } from 'vitest'
import { carnotEta, createHeatEngineModel, heatEngineMeta } from './heatEngine'
import { resolveTMax } from '@/core/physics/types'
describe('Heat engine', () => {
  it('carnot formula', () => { expect(carnotEta(400,300)).toBeCloseTo(0.25,5) })
  it('uses tMax', () => {
    const m=createHeatEngineModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,heatEngineMeta)).toBeCloseTo(8,5)
  })
})
