import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
export function createConductionAdapter(): DemoAdapter {
  let line: THREE.Line|null=null
  return {
    paint2d(host:Canvas2DHost,snap:ObserveSnapshot,_c:DemoAdapterContext){
      const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
      const {sx,sy}=drawGridAndAxes2D(ctx,{xMin:-0.1,xMax:1.1,yMin:-0.1,yMax:1.2},W,H)
      const path=snap.trails?.path
      if(path){ for(let i=0;i<path.length-1;i++){ const a=path[i]!, b=path[i+1]!; const T=a[1]??0; ctx.strokeStyle=`rgb(${Math.floor(40+200*T)},${Math.floor(80+40*T)},${Math.floor(200-150*T)})`; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(sx(a[0]!),sy(a[1]!)); ctx.lineTo(sx(b[0]!),sy(b[1]!)); ctx.stroke() } }
      ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(460,W-24),48)
      drawDiagramLabel(ctx,`热传导 · T_mid=${Number(snap.values.Tmid??0).toFixed(2)}  κ=${Number(snap.values.kappa??0).toFixed(2)}`,22,28,{color:'#fde68a',font:'bold 13px sans-serif'})
      drawDiagramLabel(ctx,'左=1 右=0；剖面趋近直线',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
    },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[0.5,0.5,0],yaw:0.4,pitch:0.45,distance:6,distanceMin:2,distanceMax:14}); line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xfbbf24})); host.scene.add(line) },
    paint3d(host,snap){ if(!line)return; const path=snap.trails?.path; if(path?.length) setTrailPositions(line,path.map(p=>[p[0]!,p[1]!,0])); host.render() },
    dispose3d(){ line=null }, dispose(){ this.dispose3d?.() },
  }
}
