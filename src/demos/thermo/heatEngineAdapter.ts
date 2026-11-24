import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawArrow, drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'
export function createHeatEngineAdapter(): DemoAdapter {
  let box: THREE.Mesh|null=null
  return {
    paint2d(host:Canvas2DHost,snap:ObserveSnapshot,_c:DemoAdapterContext){
      const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
      const {sx,sy}=drawGridAndAxes2D(ctx,{xMin:-3.5,xMax:3.5,yMin:-2.5,yMax:2.5},W,H)
      ctx.fillStyle='rgba(248,113,113,0.35)'; ctx.fillRect(sx(-1.2),sy(1.8),sx(1.2)-sx(-1.2),sy(0.6)-sy(1.8))
      ctx.fillStyle='rgba(56,189,248,0.35)'; ctx.fillRect(sx(-1.2),sy(-0.6),sx(1.2)-sx(-1.2),sy(-1.8)-sy(-0.6))
      ctx.strokeStyle='#e2e8f0'; ctx.strokeRect(sx(-0.8),sy(0.5),sx(0.8)-sx(-0.8),sy(-0.5)-sy(0.5))
      drawArrow(ctx,sx(0),sy(1.5),sx(0),sy(0.55),'#f87171',2.5)
      drawArrow(ctx,sx(0),sy(-0.55),sx(0),sy(-1.5),'#38bdf8',2.5)
      drawArrow(ctx,sx(0.9),sy(0),sx(2.4),sy(0),'#fbbf24',2.5)
      drawDiagramLabel(ctx,'Qh',sx(0.15),sy(1.2),{color:'#f87171',font:'12px sans-serif'})
      drawDiagramLabel(ctx,'Qc',sx(0.15),sy(-1.1),{color:'#38bdf8',font:'12px sans-serif'})
      drawDiagramLabel(ctx,'W',sx(2.5),sy(0.15),{color:'#fbbf24',font:'12px sans-serif'})
      ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(500,W-24),48)
      drawDiagramLabel(ctx,`热机 · η=${Number(snap.values.etaReal??0).toFixed(2)}  η_C=${Number(snap.values.etaC??0).toFixed(2)}`,22,28,{color:'#fde68a',font:'bold 13px sans-serif'})
      drawDiagramLabel(ctx,'卡诺为上限；实际更低',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
    },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[0,0,0],yaw:0.5,pitch:0.5,distance:8,distanceMin:3,distanceMax:16}); box=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2),new THREE.MeshStandardMaterial({color:0xfbbf24})); host.scene.add(box) },
    paint3d(host,snap){ if(!box)return; const p=Number(snap.values.phase??0); box.rotation.y=p*Math.PI*2; host.render() },
    dispose3d(){ box=null }, dispose(){ this.dispose3d?.() },
  }
}
