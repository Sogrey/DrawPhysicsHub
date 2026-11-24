import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createPhaseAdapter } from './phaseAdapter'

/** 加热：升温→潜热平台→再升温 */
export function phaseState(Q: number, Tm=1, Lf=2, c=1){
  if(Q < c*Tm) return { T:Q/c, phase:0, label:'固/升温' }
  if(Q < c*Tm+Lf) return { T:Tm, phase:(Q-c*Tm)/Lf, label:'熔化中' }
  return { T:Tm+(Q-c*Tm-Lf)/c, phase:1, label:'液/升温' }
}

export function createPhaseModel(): PhysicsModel {
  let Lf=2, c=1, t=0; const period=10
  return {
    init(p:ParamValues){ Lf=Number(p.Lf??2); c=Number(p.c??1); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){
      const Q=0.2+4.5*t/period; const s=phaseState(Q,1,Lf,c)
      const path:number[][]=[]; for(let i=0;i<=60;i++){ const q=0.2+4.5*i/60; path.push([q, phaseState(q,1,Lf,c).T]) }
      return { time:t, values:{ Lf,c,Q,T:s.T,melt:s.phase,period,tMax:period,done:t>=period-1e-9?1:0 }, trails:{ path } }
    },
    reset(){ t=0 }, setParams(p){ if(p.Lf!==undefined)Lf=Number(p.Lf); if(p.c!==undefined)c=Number(p.c) },
  }
}
export const phaseMeta: DemoMeta = {
  id:'thermo-phase', subject:'热学', category:'相变', tags:['相变','潜热'],
  model:'phase', adapter:'phase', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[{key:'Lf',label:'潜热 Lf',kind:'number',default:2,min:0.8,max:4,step:0.2,unit:''},{key:'c',label:'比热 c',kind:'number',default:1,min:0.5,max:2,step:0.1,unit:''}],
  views:[
    {id:'main2d',kind:'canvas2d',title:'相变'},
    {id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'T',chartKey:'T',charts:[{id:'tq',title:'T-Q',xLabel:'t',leftLabel:'T',series:[{key:'T',label:'T',color:'#fbbf24',unit:''},{key:'melt',label:'液相分数',color:'#38bdf8',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[{key:'t',label:'t',unit:'s',tone:'cyan'},{key:'T',label:'T',unit:'',tone:'amber'},{key:'melt',label:'液相',unit:'',tone:'blue'},{key:'Q',label:'Q',unit:'',tone:'purple'}],
  docs:{title:'相变与潜热示意',summary:'加热曲线在熔点出现平台：热量用于熔化（潜热），温度不变。',concept:['潜热','相变平台','T-Q 图'],objectives:['识别平台','增大 Lf 拉长平台','读液相分数'],formulas:['Q_L=m L_f'],insight:'金曲线=T(Q)；平台=熔化。',legend:[{color:'#fbbf24',label:'T(Q)'}],
    steps:[{id:'plat',title:'平台',body:'拖到熔化段看 T 不变。',formulas:['T=T_m'],bindings:[{labelTex:'T',valueKey:'T',unit:''},{labelTex:'f',valueKey:'melt',unit:''}]}],
    challenges:[{id:'melt',prompt:'使液相分数约 0.5。',hint:'平台中段。',check:{kind:'valueNear',key:'melt',target:0.5,tol:0.35}}],
  },
}
export function registerPhaseDemo(){ registerDemoBundle({meta:phaseMeta,model:createPhaseModel,adapter:createPhaseAdapter}) }
