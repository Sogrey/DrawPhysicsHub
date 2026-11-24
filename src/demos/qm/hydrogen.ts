import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createHydrogenAdapter } from './hydrogenAdapter'

/** 氢原子径向概率密度示意 R²r²（未归一教学） */
export function radialProb(n: number, r: number): number {
  const rho = 2*r/n
  if(n===1) return 4*r*r*Math.exp(-2*r)
  if(n===2) return 0.5*r*r*(1-r/2)**2*Math.exp(-r)
  // n=3 rough
  return 0.2*r*r*(1-2*r/3+2*r*r/27)**2*Math.exp(-2*r/3)
}

export function createHydrogenModel(): PhysicsModel {
  let n=1, t=0; const period=8
  return {
    init(p:ParamValues){ n=Math.round(Number(p.n??1)); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){
      const nn=Math.min(3,Math.max(1,n))
      const path:number[][]=[]; let rPeak=0, pMax=0
      for(let i=0;i<=80;i++){ const r=i*12/80; const p=radialProb(nn,r); path.push([r,p]); if(p>pMax){ pMax=p; rPeak=r } }
      const phase=2*Math.PI*t/period
      return { time:t, values:{ n:nn,rPeak,pMax,phase,period,tMax:period,done:t>=period-1e-9?1:0 }, trails:{ path } }
    },
    reset(){ t=0 }, setParams(p){ if(p.n!==undefined) n=Math.round(Number(p.n)) },
  }
}
export const hydrogenMeta: DemoMeta = {
  id:'qm-hydrogen', subject:'量子力学', category:'自旋与原子', tags:['氢原子','径向波函数'],
  model:'hydrogen', adapter:'hydrogen', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[{key:'n',label:'主量子数 n',kind:'number',default:1,min:1,max:3,step:1,unit:''}],
  views:[
    {id:'main2d',kind:'canvas2d',title:'径向'},
    {id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'峰',chartKey:'rPeak',charts:[{id:'r',title:'最概然半径',xLabel:'t',leftLabel:'r',series:[{key:'rPeak',label:'r_mp',color:'#fbbf24',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[{key:'t',label:'t',unit:'s',tone:'cyan'},{key:'n',label:'n',unit:'',tone:'purple'},{key:'rPeak',label:'r_mp',unit:'',tone:'amber'}],
  docs:{title:'氢原子径向概率密度',summary:'P(r)∝r²R²。n=1 峰在 Bohr 半径量级；n↑ 峰外移并出现节点。',concept:['径向概率','最概然半径','节点数 n−1'],objectives:['切换 n','找最概然半径','观察节点'],formulas:['P(r)=r^2|R_{nl}|^2'],insight:'金曲线=P(r)；竖线≈峰位。',legend:[{color:'#fbbf24',label:'P(r)'}],
    steps:[{id:'n',title:'n',body:'取 n=2 看外移。',formulas:['n'],bindings:[{labelTex:'r',valueKey:'rPeak',unit:''},{labelTex:'n',valueKey:'n',unit:''}]}],
    challenges:[{id:'n3',prompt:'取 n=3。',hint:'调主量子数。',check:{kind:'paramNear',key:'n',target:3,tol:0.5}}],
  },
}
export function registerHydrogenDemo(){ registerDemoBundle({meta:hydrogenMeta,model:createHydrogenModel,adapter:createHydrogenAdapter}) }
