import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'
export function createAiryAdapter(): DemoAdapter {
  let disc: THREE.Mesh|null=null
  return {
    paint2d(host:Canvas2DHost,snap:ObserveSnapshot,_c:DemoAdapterContext){
      const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
      const {sx,sy}=drawGridAndAxes2D(ctx,{xMin:-3,xMax:3,yMin:-3,yMax:3},W,H,{isotropic:true})
      const first=Number(snap.values.first??1)
      const Rpix=Math.abs(sx(Math.min(2.5,0.4+first*2))-sx(0))
      const g=ctx.createRadialGradient(sx(0),sy(0),0,sx(0),sy(0),Rpix)
      g.addColorStop(0,'rgba(251,191,36,0.95)'); g.addColorStop(0.35,'rgba(251,191,36,0.35)'); g.addColorStop(0.55,'rgba(56,189,248,0.25)'); g.addColorStop(1,'rgba(15,23,42,0)')
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx(0),sy(0),Rpix*1.6,0,Math.PI*2); ctx.fill()
      ctx.strokeStyle='rgba(148,163,184,0.6)'; ctx.beginPath(); ctx.arc(sx(0),sy(0),Rpix,0,Math.PI*2); ctx.stroke()
      ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(480,W-24),48)
      drawDiagramLabel(ctx,`艾里斑 · θ₁=${first.toFixed(3)}  NA=${Number(snap.values.NA??0).toFixed(2)}`,22,28,{color:'#fde68a',font:'bold 13px sans-serif'})
      drawDiagramLabel(ctx,'灰圈≈第一暗环；中心亮斑',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
    },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[0,0,0],yaw:0.4,pitch:0.8,distance:8,distanceMin:3,distanceMax:16}); disc=new THREE.Mesh(new THREE.CircleGeometry(1.2,48),new THREE.MeshBasicMaterial({color:0xfbbf24,transparent:true,opacity:0.7,side:THREE.DoubleSide})); disc.rotation.x=-Math.PI/2; host.scene.add(disc) },
    paint3d(host,snap){ if(!disc)return; const s=Math.max(0.3,Number(snap.values.first??1)*3); disc.scale.setScalar(s); host.render() },
    dispose3d(){ disc=null }, dispose(){ this.dispose3d?.() },
  }
}
