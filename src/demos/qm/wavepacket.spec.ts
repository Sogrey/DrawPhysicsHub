import { describe, expect, it } from 'vitest'
import { createWavepacketModel, wavepacketMeta } from './wavepacket'
import { resolveTMax } from '@/core/physics/types'
describe('Wavepacket', () => {
  it('T+R ~ 1', () => { const m=createWavepacketModel(); m.init({}); const o=m.observe().values; expect(Number(o.T)+Number(o.R)).toBeCloseTo(1,5) })
  it('uses tMax', () => {
    const m=createWavepacketModel(); m.init({})
    const live:Record<string,number>={}
    for(const [k,v] of Object.entries(m.observe().values)) if(typeof v==='number') live[k]=v
    expect(resolveTMax(live,wavepacketMeta)).toBeCloseTo(8,5)
  })
})
