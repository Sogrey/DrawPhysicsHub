import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createGaussAdapter } from './gaussAdapter'
export function fluxSphere(Q: number, eps=1){ return Q/eps }
export function createGaussModel(): PhysicsModel {
  let Q=2, t=0; const period=8
  return {
    init(p:ParamValues){ Q=Number(p.Q??2); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){ const R=0.6+2.2*t/period; const E=Q/(R*R); const Phi=fluxSphere(Q); return { time:t, values:{ Q,R,E,Phi,period,tMax:period,done:t>=period-1e-9?1:0 } } },
    reset(){ t=0 }, setParams(p){ if(p.Q!==undefined) Q=Number(p.Q) },
  }
}
export const gaussMeta: DemoMeta = {
  id:'em-gauss', subject:'电磁学', category:'静电场', tags:['高斯面','通量'],
  model:'gauss', adapter:'gauss', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[{key:'Q',label:'电荷 Q',kind:'number',default:2,min:0.5,max:4,step:0.25,unit:''}],
  views:[
    {id:'main2d',kind:'canvas2d',title:'高斯面'},{id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'Φ',chartKey:'Phi',charts:[{id:'p',title:'通量',xLabel:'t',leftLabel:'Φ',series:[{key:'Phi',label:'Φ',color:'#fbbf24',unit:''},{key:'E',label:'E',color:'#38bdf8',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[{key:'t',label:'t',unit:'s',tone:'cyan'},{key:'R',label:'R',unit:'',tone:'purple'},{key:'E',label:'E',unit:'',tone:'blue'},{key:'Phi',label:'Φ',unit:'',tone:'amber'}],
  docs:{ title:'高斯定律微元示意', summary:'点电荷球高斯面：Φ=Q/ε₀ 与半径无关；E=Q/(4πε₀R²) 随 R 下降。', concept:['通量守恒','E∝1/R²','Φ=∮E·dA=Q/ε₀'], objectives:['扫半径看 Φ 常数','观察 E 下降','理解对称性'], formulas:['\\Phi=Q/\\varepsilon_0','E=Q/(4\\pi\\varepsilon_0 R^2)'], insight:'金圈=高斯面；Φ 读数几乎不变。', legend:[{color:'#fbbf24',label:'高斯面'},{color:'#38bdf8',label:'E'}],
    steps:[{id:'const',title:'通量恒定',body:'拖动时间，Φ 不变。',formulas:['\\Phi\\mathrm{\\,const}'],bindings:[{labelTex:'\\Phi',valueKey:'Phi',unit:''},{labelTex:'R',valueKey:'R',unit:''}]}],
    challenges:[{id:'bigR',prompt:'播放使 R>2。',hint:'拖到后段。',check:{kind:'valueNear',key:'R',target:2.2,tol:1}}],
  },
}
export function registerGaussDemo(){ registerDemoBundle({meta:gaussMeta,model:createGaussModel,adapter:createGaussAdapter}) }
