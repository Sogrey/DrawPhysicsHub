import { describe, expect, it } from 'vitest'
import { createHydrogenModel, hydrogenMeta, radialProb } from './hydrogen'
import { resolveTMax } from '@/core/physics/types'
describe('Hydrogen', () => {
  it('n1 peaks near 1', () => {
    let bestR=0,best=0; for(let r=0;r<5;r+=0.05){ const p=radialProb(1,r); if(p>best){best=p;bestR=r} }
    expect(bestR).toBeGreaterThan(0.5); expect(bestR).toBeLessThan(2)
  })
  it('uses tMax', () => {
    const m=createHydrogenModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,hydrogenMeta)).toBeCloseTo(8,5)
  })
})
