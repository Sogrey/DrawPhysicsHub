import { describe, expect, it } from 'vitest'
import { createMichelsonModel, fringePhase, michelsonMeta } from './michelson'
import { resolveTMax } from '@/core/physics/types'
describe('Michelson', () => {
  it('phase scales with delta', () => { expect(fringePhase(0.4,0.8)).toBeCloseTo(Math.PI,5) })
  it('uses tMax', () => {
    const m=createMichelsonModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,michelsonMeta)).toBeCloseTo(8,5)
  })
})
