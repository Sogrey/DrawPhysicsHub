import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createWavepacketAdapter } from './wavepacketAdapter'

export function createWavepacketModel(): PhysicsModel {
  let k0=6, V0=12, t=0; const period=8
  return {
    init(p:ParamValues){ k0=Number(p.k0??6); V0=Number(p.V0??12); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){
      const x0=-2.5+3.2*t/period; const sigma=0.35
      const E=k0*k0/2; const T=E>V0? Math.min(0.95, Math.sqrt(1-V0/E)): Math.exp(-0.8*Math.sqrt(Math.max(0.1,V0-E)))
      const R=1-T
      const path:number[][]=[]
      for(let i=0;i<=100;i++){
        const x=-4+8*i/100
        let amp=Math.exp(-((x-x0)**2)/(2*sigma*sigma))
        if(x>0.2) amp*=T
        if(x<-0.2 && x0>0) amp += R*0.7*Math.exp(-((x+x0)**2)/(2*sigma*sigma))
        path.push([x, amp*Math.cos(k0*(x-x0))])
      }
      return { time:t, values:{ k0,V0,E,T,R,x0,period,tMax:period,done:t>=period-1e-9?1:0 }, trails:{ path } }
    },
    reset(){ t=0 }, setParams(p){ if(p.k0!==undefined)k0=Number(p.k0); if(p.V0!==undefined)V0=Number(p.V0) },
  }
}
export const wavepacketMeta: DemoMeta = {
  id:'qm-wavepacket', subject:'量子力学', category:'散射与隧道', tags:['波包','散射'],
  model:'wavepacket', adapter:'wavepacket', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[{key:'k0',label:'中心 k',kind:'number',default:6,min:3,max:10,step:0.5,unit:''},{key:'V0',label:'势垒 V₀',kind:'number',default:12,min:4,max:30,step:1,unit:''}],
  views:[
    {id:'main2d',kind:'canvas2d',title:'波包'},
    {id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'T',chartKey:'T',charts:[{id:'tr',title:'透射',xLabel:'t',leftLabel:'T/R',series:[{key:'T',label:'T',color:'#4ade80',unit:''},{key:'R',label:'R',color:'#f472b6',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[{key:'t',label:'t',unit:'s',tone:'cyan'},{key:'T',label:'T',unit:'',tone:'green'},{key:'R',label:'R',unit:'',tone:'pink'},{key:'E',label:'E',unit:'',tone:'amber'}],
  docs:{title:'波包散射示意',summary:'高斯波包撞势垒：部分反射、部分透射（E>V）或隧道（E<V）。教学示意。',concept:['波包','反射/透射','隧道'],objectives:['观察分裂','调 V₀/k','读 T、R'],formulas:['T+R\\approx 1'],insight:'青=波包；灰=势垒。',legend:[{color:'#38bdf8',label:'ψ'},{color:'#94a3b8',label:'V'}],
    steps:[{id:'hit',title:'入射',body:'播放过势垒。',formulas:['T'],bindings:[{labelTex:'T',valueKey:'T',unit:''},{labelTex:'R',valueKey:'R',unit:''}]}],
    challenges:[{id:'pass',prompt:'播放至波包过垒附近。',hint:'拖到中后段。',check:{kind:'valueNear',key:'t',target:4,tol:4}}],
  },
}
export function registerWavepacketDemo(){ registerDemoBundle({meta:wavepacketMeta,model:createWavepacketModel,adapter:createWavepacketAdapter}) }
