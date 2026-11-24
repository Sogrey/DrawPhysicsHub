import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createMutualAdapter } from './mutualAdapter'

export function createMutualModel(): PhysicsModel {
  let M = 0.8, Vp0 = 2, omega = 2, t = 0
  const period = 8
  return {
    init(p: ParamValues) { M=Number(p.M??0.8); Vp0=Number(p.Vp0??2); omega=Number(p.omega??2); t=0 },
    step(dt){ t=Math.min(period,t+dt) },
    seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){
      const Vp=Vp0*Math.cos(omega*t)
      const Ip=Vp // R=1 teaching
      const Vs=M*omega*Vp0*Math.sin(omega*t) // ∝ M dIp/dt
      return { time:t, values:{ M,Vp0,omega,Vp,Ip,Vs,period,tMax:period,done:t>=period-1e-9?1:0 } }
    },
    reset(){ t=0 },
    setParams(p){ if(p.M!==undefined)M=Number(p.M); if(p.Vp0!==undefined)Vp0=Number(p.Vp0); if(p.omega!==undefined)omega=Number(p.omega) },
  }
}

export const mutualMeta: DemoMeta = {
  id:'em-mutual', subject:'电磁学', category:'电磁感应', tags:['互感','变压器'],
  model:'mutual', adapter:'mutual', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[
    {key:'M',label:'互感 M',kind:'number',default:0.8,min:0.2,max:1.5,step:0.1,unit:''},
    {key:'Vp0',label:'Vp₀',kind:'number',default:2,min:0.5,max:3,step:0.25,unit:''},
    {key:'omega',label:'ω',kind:'number',default:2,min:0.8,max:4,step:0.2,unit:''},
  ],
  views:[
    {id:'main2d',kind:'canvas2d',title:'互感'},
    {id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'V',chartKey:'Vs',charts:[{id:'v',title:'电压',xLabel:'t',leftLabel:'V',series:[{key:'Vp',label:'Vp',color:'#38bdf8',unit:''},{key:'Vs',label:'Vs',color:'#f472b6',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[
    {key:'t',label:'t',unit:'s',tone:'cyan'},{key:'Vp',label:'Vp',unit:'',tone:'blue'},
    {key:'Vs',label:'Vs',unit:'',tone:'pink'},{key:'M',label:'M',unit:'',tone:'purple'},
  ],
  docs:{
    title:'互感与变压器示意', summary:'初级交流 → 互感电动势 Vs∝M dIp/dt。M↑ 次级幅度↑。',
    concept:['互感 M','次级感应电动势','变压器示意'],
    objectives:['观察 Vp/Vs 相位差约90°','增大 M 看 Vs','理解耦合'],
    formulas:['\\mathcal{E}_s=M dI_p/dt'],
    insight:'青=初级线圈电流/电压；粉=次级感应。',
    legend:[{color:'#38bdf8',label:'初级'},{color:'#f472b6',label:'次级'}],
    steps:[{id:'m',title:'互感',body:'提高 M。',formulas:['M'],bindings:[{labelTex:'V_s',valueKey:'Vs',unit:''},{labelTex:'M',valueKey:'M',unit:''}]}],
    challenges:[{id:'big',prompt:'取 M≥1.0 并播放。',hint:'调互感。',check:{kind:'paramNear',key:'M',target:1.2,tol:0.4}}],
  },
}
export function registerMutualDemo(){ registerDemoBundle({meta:mutualMeta,model:createMutualModel,adapter:createMutualAdapter}) }
