import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
export function createFabryPerotAdapter(): DemoAdapter {
  let line: THREE.Line|null=null
  return {
    paint2d(host:Canvas2DHost,snap:ObserveSnapshot,_c:DemoAdapterContext){
      const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
      const {sx,sy}=drawGridAndAxes2D(ctx,{xMin:-0.3,xMax:13,yMin:-0.2,yMax:1.3},W,H)
      const path=snap.trails?.path
      if(path&&path.length>1){ ctx.strokeStyle='rgba(251,191,36,0.95)'; ctx.lineWidth=2; ctx.beginPath()
        for(let i=0;i<path.length;i++){ const p=path[i]!; const X=p[0]!; const Y=p[1]!; if(i===0)ctx.moveTo(sx(X),sy(Y)); else ctx.lineTo(sx(X),sy(Y)) } ctx.stroke() }
      drawMarker(ctx,sx(Number(snap.values.delta??0)),sy(Number(snap.values.I??0)),{radius:5,fill:'#a78bfa',label:''})
      ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(480,W-24),48)
      drawDiagramLabel(ctx,`F-P · R=${Number(snap.values.R??0).toFixed(2)}  F=${Number(snap.values.Fns??0).toFixed(1)}  I=${Number(snap.values.I??0).toFixed(2)}`,22,28,{color:'#fde68a',font:'bold 13px sans-serif'})
      drawDiagramLabel(ctx,'透射峰随相位扫描；R↑峰更尖',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
    },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[6,0.5,0],yaw:0.3,pitch:0.4,distance:14,distanceMin:5,distanceMax:28}); line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xfbbf24})); host.scene.add(line) },
    paint3d(host,snap){ if(!line)return; const path=snap.trails?.path; if(path?.length) setTrailPositions(line,path.map(p=>[p[0]!,p[1]!,0])); host.render() },
    dispose3d(){ line=null }, dispose(){ this.dispose3d?.() },
  }
}
