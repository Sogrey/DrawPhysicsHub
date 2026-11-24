import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
export function createHydrogenAdapter(): DemoAdapter {
  let line: THREE.Line|null=null
  return {
    paint2d(host:Canvas2DHost,snap:ObserveSnapshot,_c:DemoAdapterContext){
      const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
      const {sx,sy}=drawGridAndAxes2D(ctx,{xMin:-0.5,xMax:12,yMin:-0.1,yMax:1.2},W,H)
      const path=snap.trails?.path; const pMax=Math.max(0.1,...(path?.map(p=>p[1]!)??[1]))
      if(path&&path.length>1){ ctx.strokeStyle='rgba(251,191,36,0.95)'; ctx.lineWidth=2.2; ctx.beginPath(); for(let i=0;i<path.length;i++){ const p=path[i]!; if(i===0)ctx.moveTo(sx(p[0]!),sy(p[1]!/pMax)); else ctx.lineTo(sx(p[0]!),sy(p[1]!/pMax)) } ctx.stroke() }
      const rp=Number(snap.values.rPeak??0); drawMarker(ctx,sx(rp),sy(1),{radius:4,fill:'#a78bfa',label:'峰',labelDy:-10})
      ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(460,W-24),48)
      drawDiagramLabel(ctx,`氢原子 · n=${Number(snap.values.n??1)}  r_mp≈${rp.toFixed(2)}`,22,28,{color:'#fde68a',font:'bold 13px sans-serif'})
      drawDiagramLabel(ctx,'径向概率密度（归一示意）',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
    },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[4,0.4,0],yaw:0.35,pitch:0.4,distance:12,distanceMin:4,distanceMax:24}); line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xfbbf24})); host.scene.add(line) },
    paint3d(host,snap){ if(!line)return; const path=snap.trails?.path; const pMax=Math.max(0.1,...(path?.map(p=>p[1]!)??[1])); if(path?.length) setTrailPositions(line,path.map(p=>[p[0]!,p[1]!/pMax,0])); host.render() },
    dispose3d(){ line=null }, dispose(){ this.dispose3d?.() },
  }
}
