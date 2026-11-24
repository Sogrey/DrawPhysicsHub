import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createMichelsonAdapter } from './michelsonAdapter'
export function fringePhase(delta: number, lambda: number){ return (2*Math.PI*delta)/Math.max(1e-6,lambda) }
export function createMichelsonModel(): PhysicsModel {
  let lambda=0.8, d0=0, t=0; const period=8
  return {
    init(p:ParamValues){ lambda=Number(p.lambda??0.8); d0=Number(p.d0??0); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){
      const delta=d0+0.6*t/period; const phi=fringePhase(2*delta,lambda); const I=0.5*(1+Math.cos(phi))
      const fringes:number[][]=[]; for(let i=0;i<=80;i++){ const x=-2+4*i/80; const ph=fringePhase(2*delta+0.15*x,lambda); fringes.push([x,0.5*(1+Math.cos(ph))]) }
      return { time:t, values:{ lambda,d0,delta,phi,I,period,tMax:period,done:t>=period-1e-9?1:0 }, trails:{ path:fringes } }
    },
    reset(){ t=0 }, setParams(p){ if(p.lambda!==undefined)lambda=Number(p.lambda); if(p.d0!==undefined)d0=Number(p.d0) },
  }
}
export const michelsonMeta: DemoMeta = {
  id:'opt-michelson', subject:'光学', category:'干涉', tags:['干涉','光程差'],
  model:'michelson', adapter:'michelson', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[{key:'lambda',label:'λ',kind:'number',default:0.8,min:0.4,max:1.4,step:0.1,unit:''},{key:'d0',label:'初程差',kind:'number',default:0,min:0,max:1,step:0.1,unit:''}],
  views:[{id:'main2d',kind:'canvas2d',title:'干涉'},{id:'scene3d',kind:'three',title:'3D'},{id:'chart',kind:'chart',title:'I',chartKey:'I',charts:[{id:'i',title:'中心强度',xLabel:'t',leftLabel:'I',series:[{key:'I',label:'I',color:'#fbbf24',unit:''},{key:'delta',label:'δ',color:'#a78bfa',unit:''}]}]},{id:'docs',kind:'docs',title:'说明'}],
  readouts:[{key:'t',label:'t',unit:'s',tone:'cyan'},{key:'delta',label:'δ',unit:'',tone:'purple'},{key:'I',label:'I',unit:'',tone:'amber'},{key:'lambda',label:'λ',unit:'',tone:'blue'}],
  docs:{title:'迈克耳孙干涉仪示意',summary:'移动反射镜改变光程差 δ，条纹明暗交替。中心 I∝1+cos(4πδ/λ)。',concept:['光程差','条纹移动','δ=λ/2 亮暗互换'],objectives:['移动镜子看条纹','对照 I(δ)','改 λ 看周期'],formulas:['I\\propto 1+\\cos(4\\pi\\delta/\\lambda)'],insight:'金=条纹强度剖面；播放=移动镜子。',legend:[{color:'#fbbf24',label:'条纹'}],
    steps:[{id:'move',title:'移动',body:'播放使 δ 增大。',formulas:['\\delta'],bindings:[{labelTex:'\\delta',valueKey:'delta',unit:''},{labelTex:'I',valueKey:'I',unit:''}]}],
    challenges:[{id:'half',prompt:'播放使 δ 明显变化。',hint:'拖进度。',check:{kind:'valueNear',key:'delta',target:0.4,tol:0.4}}],
  },
}
export function registerMichelsonDemo(){ registerDemoBundle({meta:michelsonMeta,model:createMichelsonModel,adapter:createMichelsonAdapter}) }
