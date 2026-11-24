import { describe, expect, it } from 'vitest'
import { createPhaseModel, phaseMeta, phaseState } from './phase'
import { resolveTMax } from '@/core/physics/types'
describe('Phase', () => {
  it('plateau at melt', () => { expect(phaseState(1.5,1,2,1).T).toBeCloseTo(1,5); expect(phaseState(1.5,1,2,1).phase).toBeGreaterThan(0) })
  it('uses tMax', () => {
    const m=createPhaseModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,phaseMeta)).toBeCloseTo(10,5)
  })
})
