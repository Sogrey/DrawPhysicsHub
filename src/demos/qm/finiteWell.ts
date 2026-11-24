import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createFiniteWellAdapter } from './finiteWellAdapter'

/** 有限阱教学：能级大致 E_n ≈ E∞_n * (1 - c/√V0)，并画 ψ 示意 */
export function finiteLevels(V0: number, L=2, nMax=3){
  const levels:number[]=[]
  for(let n=1;n<=nMax;n++){
    const Einf = (n*n*Math.PI*Math.PI)/(L*L) // ħ=2m=1
    const E = Math.min(V0*0.95, Einf * (1 - 0.35/Math.sqrt(Math.max(1,V0))))
    if(E<V0) levels.push(E)
  }
  return levels
}

export function createFiniteWellModel(): PhysicsModel {
  let V0=8, nShow=1, t=0; const period=8; const L=2
  return {
    init(p:ParamValues){ V0=Number(p.V0??8); nShow=Math.round(Number(p.nShow??1)); t=0 },
    step(dt){ t=Math.min(period,t+dt) }, seek(time){ t=Math.min(period,Math.max(0,time)) },
    observe(){
      const levels=finiteLevels(V0,L,3); const n=Math.min(levels.length, Math.max(1,nShow))
      const E=levels[n-1]??0; const k=Math.sqrt(Math.max(0.1,E))
      const path:number[][]=[]; for(let i=0;i<=80;i++){ const x=-2+4*i/80; let psi=0
        if(Math.abs(x)<=L/2) psi=Math.sin(n*Math.PI*(x+L/2)/L)*Math.cos(2*Math.PI*t/period)
        else psi=Math.exp(-Math.abs(x)-L/2)*0.3*Math.sin(n*Math.PI/2)*Math.cos(2*Math.PI*t/period)
        path.push([x, psi]) }
      return { time:t, values:{ V0,nShow:n,E,k,nLevels:levels.length,period,tMax:period,done:t>=period-1e-9?1:0 }, trails:{ path } }
    },
    reset(){ t=0 }, setParams(p){ if(p.V0!==undefined)V0=Number(p.V0); if(p.nShow!==undefined)nShow=Math.round(Number(p.nShow)) },
  }
}
export const finiteWellMeta: DemoMeta = {
  id:'qm-finite-well', subject:'量子力学', category:'束缚态', tags:['束缚态','有限阱'],
  model:'finiteWell', adapter:'finiteWell', time:{maxKey:'tMax'}, features:{compare:false,scrub:true,charts:true},
  params:[{key:'V0',label:'阱深 V₀',kind:'number',default:8,min:3,max:20,step:1,unit:''},{key:'nShow',label:'能级 n',kind:'number',default:1,min:1,max:3,step:1,unit:''}],
  views:[
    {id:'main2d',kind:'canvas2d',title:'有限阱'},
    {id:'scene3d',kind:'three',title:'3D'},
    {id:'chart',kind:'chart',title:'E',chartKey:'E',charts:[{id:'e',title:'能级',xLabel:'t',leftLabel:'E',series:[{key:'E',label:'E_n',color:'#fbbf24',unit:''},{key:'V0',label:'V₀',color:'#a78bfa',unit:''}]}]},
    {id:'docs',kind:'docs',title:'说明'},
  ],
  readouts:[{key:'t',label:'t',unit:'s',tone:'cyan'},{key:'E',label:'E',unit:'',tone:'amber'},{key:'nShow',label:'n',unit:'',tone:'purple'},{key:'nLevels',label:'束缚数',unit:'',tone:'blue'}],
  docs:{title:'有限深势阱能级',summary:'有限阱：波函数渗入势垒，能级低于无限阱；V₀↑ 束缚态增多。',concept:['隧穿尾巴','能级下移','束缚态数目'],objectives:['观察势垒渗透','调 V₀','切换 n'],formulas:['E_n < E_n^{\\infty}'],insight:'青=ψ；灰=势阱。',legend:[{color:'#38bdf8',label:'ψ'},{color:'#94a3b8',label:'V'}],
    steps:[{id:'deep',title:'加深',body:'增大 V₀。',formulas:['V_0'],bindings:[{labelTex:'E',valueKey:'E',unit:''},{labelTex:'V_0',valueKey:'V0',unit:''}]}],
    challenges:[{id:'n2',prompt:'取 n=2 观察。',hint:'调能级。',check:{kind:'paramNear',key:'nShow',target:2,tol:0.5}}],
  },
}
export function registerFiniteWellDemo(){ registerDemoBundle({meta:finiteWellMeta,model:createFiniteWellModel,adapter:createFiniteWellAdapter}) }
