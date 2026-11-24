import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createSternGerlachAdapter } from './sternGerlachAdapter'

export function createSternGerlachModel(): PhysicsModel {
  let Bgrad=1.2, t=0; const period=8
  return {
    init(p:ParamValues){ Bgrad=Number(p.Bgrad??1.2); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe() {
      const x = -2.5 + (5 * t) / period
      const sep = Bgrad * Math.max(0, x + 0.5) * 0.35
      const beamU: number[][] = []
      const beamD: number[][] = []
      for (let i = 0; i <= 40; i++) {
        const xi = -2.5 + (5 * i) / 40
        const s = Bgrad * Math.max(0, xi + 0.5) * 0.35
        beamU.push([xi, s])
        beamD.push([xi, -s])
      }
      return {
        time: t,
        values: { Bgrad, x, sep, period, tMax: period, done: t >= period - 1e-9 ? 1 : 0 },
        trails: { path: beamU, pathB: beamD },
      }
    },
    reset(){ t=0 }, setParams(p){ if(p.Bgrad!==undefined) Bgrad=Number(p.Bgrad) },
  }
}
export const sternGerlachMeta: DemoMeta = {
  id:'qm-stern-gerlach', subject:'量子力学', category:'自旋与原子', tags:['自旋','Stern-Gerlach'],
  model:'sternGerlach', adapter:'sternGerlach', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[{key:'Bgrad',label:'磁场梯度',kind:'number',default:1.2,min:0.4,max:2.5,step:0.1,unit:''}],
  views:[
    {id:'main2d',kind:'canvas2d',title:'SG'},
    {id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'分离',chartKey:'sep',charts:[{id:'s',title:'束分离',xLabel:'t',leftLabel:'Δy',series:[{key:'sep',label:'分离',color:'#fbbf24',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[{key:'t',label:'t',unit:'s',tone:'cyan'},{key:'sep',label:'分离',unit:'',tone:'amber'},{key:'Bgrad',label:'∇B',unit:'',tone:'purple'}],
  docs:{title:'斯特恩–盖拉赫示意',summary:'自旋 1/2 束在非均匀磁场中分为上下两束，而非连续扇形——自旋量子化。',concept:['自旋投影 ±ħ/2','两束分裂','非均匀 B'],objectives:['观察两束','增大梯度','理解量子化'],formulas:['F=\\mu_z \\partial_z B'],insight:'青/粉=两自旋分量。',legend:[{color:'#38bdf8',label:'↑'},{color:'#f472b6',label:'↓'}],
    steps:[{id:'split',title:'分裂',body:'播放过磁铁区。',formulas:['\\pm'],bindings:[{labelTex:'\\Delta',valueKey:'sep',unit:''}]}],
    challenges:[{id:'wide',prompt:'使分离明显（sep>0.5）。',hint:'增大梯度或拖后段。',check:{kind:'valueNear',key:'sep',target:0.8,tol:0.7}}],
  },
}
export function registerSternGerlachDemo(){ registerDemoBundle({meta:sternGerlachMeta,model:createSternGerlachModel,adapter:createSternGerlachAdapter}) }
