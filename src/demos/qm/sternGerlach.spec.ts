import { describe, expect, it } from 'vitest'
import { createSternGerlachModel, sternGerlachMeta } from './sternGerlach'
import { resolveTMax } from '@/core/physics/types'
describe('Stern-Gerlach', () => {
  it('separation grows', () => { const m=createSternGerlachModel(); m.init({}); m.seek?.(1); const a=Number(m.observe().values.sep); m.seek?.(6); expect(Number(m.observe().values.sep)).toBeGreaterThan(a) })
  it('uses tMax', () => {
    const m=createSternGerlachModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,sternGerlachMeta)).toBeCloseTo(8,5)
  })
})
