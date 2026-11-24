import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createHeatEngineAdapter } from './heatEngineAdapter'

export function carnotEta(Th: number, Tc: number){ return 1 - Tc/Math.max(Th,1e-6) }

export function createHeatEngineModel(): PhysicsModel {
  let Th=400, Tc=300, etaReal=0.18, t=0; const period=8
  return {
    init(p:ParamValues){ Th=Number(p.Th??400); Tc=Number(p.Tc??300); etaReal=Number(p.etaReal??0.18); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){
      const etaC=carnotEta(Th,Tc); const Qh=1; const W=etaReal*Qh; const Qc=Qh-W
      const phase=t/period
      return { time:t, values:{ Th,Tc,etaC,etaReal,Qh,W,Qc,phase,ratio:etaReal/Math.max(1e-6,etaC),period,tMax:period,done:t>=period-1e-9?1:0 } }
    },
    reset(){ t=0 }, setParams(p){ if(p.Th!==undefined)Th=Number(p.Th); if(p.Tc!==undefined)Tc=Number(p.Tc); if(p.etaReal!==undefined)etaReal=Number(p.etaReal) },
  }
}
export const heatEngineMeta: DemoMeta = {
  id:'thermo-heat-engine', subject:'热学', category:'热力学循环', tags:['热机','效率'],
  model:'heatEngine', adapter:'heatEngine', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[
    {key:'Th',label:'Th',kind:'number',default:400,min:320,max:600,step:10,unit:'K'},
    {key:'Tc',label:'Tc',kind:'number',default:300,min:200,max:350,step:10,unit:'K'},
    {key:'etaReal',label:'实际效率',kind:'number',default:0.18,min:0.05,max:0.4,step:0.01,unit:''},
  ],
  views:[
    {id:'main2d',kind:'canvas2d',title:'热机'},
    {id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'η',chartKey:'etaReal',charts:[{id:'e',title:'效率',xLabel:'t',leftLabel:'η',series:[{key:'etaC',label:'η_C',color:'#a78bfa',unit:''},{key:'etaReal',label:'η',color:'#fbbf24',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[{key:'t',label:'t',unit:'s',tone:'cyan'},{key:'etaC',label:'η_C',unit:'',tone:'purple'},{key:'etaReal',label:'η',unit:'',tone:'amber'},{key:'W',label:'W',unit:'',tone:'green'}],
  docs:{title:'热机效率对照',summary:'卡诺上限 η_C=1−Tc/Th；实际效率更低。对照 Qh、Qc、W。',concept:['卡诺效率','不可逆损失','W=Qh−Qc'],objectives:['对照 η 与 η_C','提高 Th','理解上限'],formulas:['\\eta_C=1-T_c/T_h','W=Q_h-Q_c'],insight:'红=热源，蓝=冷源，金=功。',legend:[{color:'#f87171',label:'Qh'},{color:'#38bdf8',label:'Qc'},{color:'#fbbf24',label:'W'}],
    steps:[{id:'carnot',title:'上限',body:'η 不可超过 η_C。',formulas:['\\eta\\le\\eta_C'],bindings:[{labelTex:'\\eta_C',valueKey:'etaC',unit:''},{labelTex:'\\eta',valueKey:'etaReal',unit:''}]}],
    challenges:[{id:'gap',prompt:'使 η/η_C < 0.8。',hint:'默认即可。',check:{kind:'valueNear',key:'ratio',target:0.7,tol:0.3}}],
  },
}
export function registerHeatEngineDemo(){ registerDemoBundle({meta:heatEngineMeta,model:createHeatEngineModel,adapter:createHeatEngineAdapter}) }
