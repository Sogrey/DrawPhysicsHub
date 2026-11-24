import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'
export function createGaussAdapter(): DemoAdapter {
  let sphere: THREE.Mesh|null=null
  return {
    paint2d(host:Canvas2DHost,snap:ObserveSnapshot,_c:DemoAdapterContext){
      const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
      const world={xMin:-3.5,xMax:3.5,yMin:-3.5,yMax:3.5}; const {sx,sy}=drawGridAndAxes2D(ctx,world,W,H,{isotropic:true})
      const R=Number(snap.values.R??1)
      ctx.strokeStyle='rgba(251,191,36,0.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(sx(0),sy(0),Math.abs(sx(R)-sx(0)),0,Math.PI*2); ctx.stroke()
      drawMarker(ctx,sx(0),sy(0),{radius:7,fill:'#f87171',label:'Q',labelDy:-12})
      for(let i=0;i<8;i++){ const a=i*Math.PI/4; ctx.strokeStyle='rgba(56,189,248,0.7)'; ctx.beginPath(); ctx.moveTo(sx(0.2*Math.cos(a)),sy(0.2*Math.sin(a))); ctx.lineTo(sx(R*Math.cos(a)),sy(R*Math.sin(a))); ctx.stroke() }
      ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(460,W-24),48)
      drawDiagramLabel(ctx,`高斯 · R=${R.toFixed(2)}  Φ=${Number(snap.values.Phi??0).toFixed(2)}  E=${Number(snap.values.E??0).toFixed(2)}`,22,28,{color:'#fde68a',font:'bold 13px sans-serif'})
      drawDiagramLabel(ctx,'Φ 与 R 无关（教学 ε₀=1）',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
    },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[0,0,0],yaw:0.6,pitch:0.5,distance:9,distanceMin:3,distanceMax:18}); sphere=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshStandardMaterial({color:0xfbbf24,wireframe:true,transparent:true,opacity:0.5})); host.scene.add(sphere) },
    paint3d(host,snap){ if(!sphere)return; const R=Number(snap.values.R??1); sphere.scale.setScalar(R); host.render() },
    dispose3d(){ sphere=null }, dispose(){ this.dispose3d?.() },
  }
}
