import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
export function createFiniteWellAdapter(): DemoAdapter {
  let line: THREE.Line|null=null
  return {
    paint2d(host:Canvas2DHost,snap:ObserveSnapshot,_c:DemoAdapterContext){
      const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
      const {sx,sy}=drawGridAndAxes2D(ctx,{xMin:-2.5,xMax:2.5,yMin:-1.5,yMax:2},W,H)
      const V0=Number(snap.values.V0??8)
      ctx.strokeStyle='rgba(148,163,184,0.8)'; ctx.lineWidth=2
      ctx.beginPath(); ctx.moveTo(sx(-2.2),sy(Math.min(1.6,V0*0.15))); ctx.lineTo(sx(-1),sy(Math.min(1.6,V0*0.15))); ctx.lineTo(sx(-1),sy(0)); ctx.lineTo(sx(1),sy(0)); ctx.lineTo(sx(1),sy(Math.min(1.6,V0*0.15))); ctx.lineTo(sx(2.2),sy(Math.min(1.6,V0*0.15))); ctx.stroke()
      const path=snap.trails?.path
      if(path&&path.length>1){ ctx.strokeStyle='rgba(56,189,248,0.95)'; ctx.lineWidth=2; ctx.beginPath(); for(let i=0;i<path.length;i++){ const p=path[i]!; if(i===0)ctx.moveTo(sx(p[0]!),sy(p[1]!)); else ctx.lineTo(sx(p[0]!),sy(p[1]!)) } ctx.stroke() }
      ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(460,W-24),48)
      drawDiagramLabel(ctx,`有限阱 · n=${Number(snap.values.nShow??1)}  E=${Number(snap.values.E??0).toFixed(2)}  V₀=${V0}`,22,28,{color:'#bae6fd',font:'bold 13px sans-serif'})
      drawDiagramLabel(ctx,'阱外指数衰减尾巴',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
    },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[0,0,0],yaw:0.4,pitch:0.45,distance:8,distanceMin:3,distanceMax:16}); line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x38bdf8})); host.scene.add(line) },
    paint3d(host,snap){ if(!line)return; const path=snap.trails?.path; if(path?.length) setTrailPositions(line,path.map(p=>[p[0]!,p[1]!,0])); host.render() },
    dispose3d(){ line=null }, dispose(){ this.dispose3d?.() },
  }
}
