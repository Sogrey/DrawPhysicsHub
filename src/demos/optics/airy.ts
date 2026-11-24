import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createAiryAdapter } from './airyAdapter'

/** 艾里近似：I∝[2J1(x)/x]² ≈ sinc² 教学 */
export function airyI(x: number): number {
  if (Math.abs(x) < 1e-6) return 1
  const s = Math.sin(x) / x
  return s * s
}

export function createAiryModel(): PhysicsModel {
  let a = 1.2, lambda = 0.55, t = 0
  const period = 8
  return {
    init(p: ParamValues) { a=Number(p.a??1.2); lambda=Number(p.lambda??0.55); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){
      const NA = 0.4 + 0.5*t/period
      const first = 1.22*lambda/Math.max(0.2,a*NA) // angular radius teaching
      const path:number[][]=[]
      for(let i=0;i<=80;i++){ const r=i/20; path.push([r, airyI(r*Math.PI*1.2)]) }
      return { time:t, values:{ a,lambda,NA,first,I0:1,period,tMax:period,done:t>=period-1e-9?1:0 }, trails:{ path } }
    },
    reset(){ t=0 }, setParams(p){ if(p.a!==undefined)a=Number(p.a); if(p.lambda!==undefined)lambda=Number(p.lambda) },
  }
}

export const airyMeta: DemoMeta = {
  id:'opt-airy', subject:'光学', category:'衍射', tags:['艾里斑','分辨本领'],
  model:'airy', adapter:'airy', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[
    {key:'a',label:'孔径 a',kind:'number',default:1.2,min:0.5,max:2,step:0.1,unit:''},
    {key:'lambda',label:'λ',kind:'number',default:0.55,min:0.4,max:0.7,step:0.05,unit:''},
  ],
  views:[
    {id:'main2d',kind:'canvas2d',title:'艾里'},
    {id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'I',chartKey:'first',charts:[{id:'r',title:'第一暗环',xLabel:'t',leftLabel:'θ',series:[{key:'first',label:'θ₁',color:'#fbbf24',unit:''},{key:'NA',label:'NA',color:'#a78bfa',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[
    {key:'t',label:'t',unit:'s',tone:'cyan'},{key:'first',label:'θ₁',unit:'',tone:'amber'},
    {key:'NA',label:'NA',unit:'',tone:'purple'},{key:'lambda',label:'λ',unit:'',tone:'blue'},
  ],
  docs:{
    title:'圆孔衍射与艾里斑',
    summary:'圆孔远场衍射中心亮斑（艾里斑）。第一暗环 θ≈1.22 λ/D；孔径↑ 斑↓。',
    concept:['艾里斑','分辨极限','θ∝λ/D'],
    objectives:['观察径向强度','扫 NA 看斑大小','理解分辨本领'],
    formulas:['\\theta\\approx 1.22\\lambda/D'],
    insight:'金=径向 I(r)；播放增大有效孔径角。',
    legend:[{color:'#fbbf24',label:'I(r)'}],
    steps:[{id:'res',title:'分辨',body:'NA↑ → θ₁↓。',formulas:['\\theta\\propto 1/D'],bindings:[{labelTex:'\\theta_1',valueKey:'first',unit:''},{labelTex:'NA',valueKey:'NA',unit:''}]}],
    challenges:[{id:'tight',prompt:'播放使 first 明显小于初值。',hint:'拖到后段。',check:{kind:'valueNear',key:'t',target:5,tol:4}}],
  },
}
export function registerAiryDemo(){ registerDemoBundle({meta:airyMeta,model:createAiryModel,adapter:createAiryAdapter}) }
