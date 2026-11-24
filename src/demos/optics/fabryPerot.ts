import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createFabryPerotAdapter } from './fabryPerotAdapter'

/** F-P Airy函数：I=1/(1+F sin²(δ/2))，F=4R/(1-R)² */
export function fabryI(delta: number, R: number): number {
  const F = (4 * R) / Math.max(1e-6, (1 - R) ** 2)
  const s = Math.sin(delta / 2)
  return 1 / (1 + F * s * s)
}
export function finesse(R: number): number {
  return Math.PI * Math.sqrt(R) / Math.max(1e-6, 1 - R)
}

export function createFabryPerotModel(): PhysicsModel {
  let R = 0.7, t = 0
  const period = 8
  return {
    init(p: ParamValues) { R=Number(p.R??0.7); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){
      const delta = (4 * Math.PI * t) / period
      const I = fabryI(delta, R)
      const Fns = finesse(R)
      const path:number[][]=[]
      for(let i=0;i<=120;i++){ const d= (4*Math.PI*i)/120; path.push([d, fabryI(d,R)]) }
      return { time:t, values:{ R,delta,I,Fns,period,tMax:period,done:t>=period-1e-9?1:0 }, trails:{ path } }
    },
    reset(){ t=0 }, setParams(p){ if(p.R!==undefined) R=Number(p.R) },
  }
}

export const fabryPerotMeta: DemoMeta = {
  id:'opt-fabry-perot', subject:'光学', category:'干涉', tags:['F-P','精细度'],
  model:'fabryPerot', adapter:'fabryPerot', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[{key:'R',label:'反射率 R',kind:'number',default:0.7,min:0.2,max:0.92,step:0.02,unit:''}],
  views:[
    {id:'main2d',kind:'canvas2d',title:'F-P'},
    {id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'I',chartKey:'I',charts:[{id:'i',title:'透射',xLabel:'t',leftLabel:'I',series:[{key:'I',label:'I',color:'#fbbf24',unit:''},{key:'Fns',label:'F',color:'#a78bfa',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[
    {key:'t',label:'t',unit:'s',tone:'cyan'},{key:'I',label:'I',unit:'',tone:'amber'},
    {key:'Fns',label:'精细度',unit:'',tone:'purple'},{key:'R',label:'R',unit:'',tone:'blue'},
  ],
  docs:{
    title:'法布里–珀罗多光束干涉',
    summary:'高反射腔：透射峰尖锐，精细度随 R↑。Airy 函数 I=1/(1+F sin²(δ/2))。',
    concept:['多光束干涉','精细度','峰尖锐度∝R'],
    objectives:['扫相位看尖峰','提高 R 看精细度','对照单缝宽峰'],
    formulas:['I=\\frac{1}{1+F\\sin^2(\\delta/2)}','\\mathcal{F}\\approx\\pi\\sqrt{R}/(1-R)'],
    insight:'金曲线=透射谱；紫=精细度。',
    legend:[{color:'#fbbf24',label:'I(δ)'}],
    steps:[{id:'hiR',title:'高 R',body:'R→0.9，峰更尖。',formulas:['\\mathcal{F}'],bindings:[{labelTex:'\\mathcal{F}',valueKey:'Fns',unit:''},{labelTex:'R',valueKey:'R',unit:''}]}],
    challenges:[{id:'sharp',prompt:'取 R≥0.85。',hint:'调反射率。',check:{kind:'paramNear',key:'R',target:0.9,tol:0.1}}],
  },
}
export function registerFabryPerotDemo(){ registerDemoBundle({meta:fabryPerotMeta,model:createFabryPerotModel,adapter:createFabryPerotAdapter}) }
