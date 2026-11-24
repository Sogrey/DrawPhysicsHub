import { describe, expect, it } from 'vitest'
import { airyI, airyMeta, createAiryModel } from './airy'
import { resolveTMax } from '@/core/physics/types'
describe('Airy', () => {
  it('peaks at center', () => { expect(airyI(0)).toBeCloseTo(1,5); expect(airyI(Math.PI)).toBeLessThan(0.1) })
  it('uses tMax', () => {
    const m=createAiryModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,airyMeta)).toBeCloseTo(8,5)
  })
})
