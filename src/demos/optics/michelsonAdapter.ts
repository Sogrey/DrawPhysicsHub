import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
export function createMichelsonAdapter(): DemoAdapter {
  let line: THREE.Line|null=null
  return {
    paint2d(host:Canvas2DHost,snap:ObserveSnapshot,_c:DemoAdapterContext){
      const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
      const {sx,sy}=drawGridAndAxes2D(ctx,{xMin:-2.5,xMax:2.5,yMin:-1.5,yMax:2.2},W,H)
      const path=snap.trails?.path
      if(path){ for(const p of path){ const h=p[1]!*1.5; ctx.fillStyle=`rgba(251,191,36,${0.25+0.7*(p[1]??0)})`; ctx.fillRect(sx(p[0]!),sy(h),Math.max(2,sx(0.06)-sx(0)),sy(0)-sy(h)) } }
      ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(460,W-24),48)
      drawDiagramLabel(ctx,`迈克耳孙 · δ=${Number(snap.values.delta??0).toFixed(2)}  I=${Number(snap.values.I??0).toFixed(2)}`,22,28,{color:'#fde68a',font:'bold 13px sans-serif'})
      drawDiagramLabel(ctx,'条纹亮度随光程差变化',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
    },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[0,0.5,0],yaw:0.4,pitch:0.45,distance:9,distanceMin:3,distanceMax:18}); line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xfbbf24})); host.scene.add(line) },
    paint3d(host,snap){ if(!line)return; const path=snap.trails?.path; if(path?.length) setTrailPositions(line,path.map(p=>[p[0]!,p[1]!,0])); host.render() },
    dispose3d(){ line=null }, dispose(){ this.dispose3d?.() },
  }
}
