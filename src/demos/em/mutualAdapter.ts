import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport, type WorldBounds } from '@/core/render/primitives2d'
import * as THREE from 'three'

function bounds(): WorldBounds { return { xMin:-4,xMax:4,yMin:-2.5,yMax:2.5 } }
function draw(host: Canvas2DHost, snap: ObserveSnapshot) {
  const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
  const {sx,sy}=drawGridAndAxes2D(ctx,bounds(),W,H)
  const Vp=Number(snap.values.Vp??0), Vs=Number(snap.values.Vs??0)
  ctx.strokeStyle='#38bdf8'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(sx(-1.5),sy(0), Math.abs(sx(-1.5+0.7)-sx(-1.5)),0,Math.PI*2); ctx.stroke()
  ctx.strokeStyle='#f472b6'; ctx.beginPath(); ctx.arc(sx(1.5),sy(0), Math.abs(sx(1.5+0.7)-sx(1.5)),0,Math.PI*2); ctx.stroke()
  ctx.fillStyle='#38bdf8'; ctx.fillRect(sx(-1.7),sy(Vp*0.4),6,sy(0)-sy(Vp*0.4))
  ctx.fillStyle='#f472b6'; ctx.fillRect(sx(1.3),sy(Vs*0.25),6,sy(0)-sy(Vs*0.25))
  ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(460,W-24),48)
  drawDiagramLabel(ctx,`互感 · Vp=${Vp.toFixed(2)}  Vs=${Vs.toFixed(2)}  M=${Number(snap.values.M??0).toFixed(2)}`,22,28,{color:'#e9d5ff',font:'bold 13px sans-serif'})
  drawDiagramLabel(ctx,'青=初级，粉=次级（条高∝瞬时电压）',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
}
export function createMutualAdapter(): DemoAdapter {
  let a: THREE.Mesh|null=null, b: THREE.Mesh|null=null
  return {
    paint2d(host,snap,_c:DemoAdapterContext){ draw(host,snap) },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[0,0,0],yaw:0.5,pitch:0.5,distance:9,distanceMin:3,distanceMax:18}); a=new THREE.Mesh(new THREE.TorusGeometry(0.7,0.08,8,24),new THREE.MeshStandardMaterial({color:0x38bdf8})); b=new THREE.Mesh(new THREE.TorusGeometry(0.7,0.08,8,24),new THREE.MeshStandardMaterial({color:0xf472b6})); a.position.x=-1.2; b.position.x=1.2; host.scene.add(a,b) },
    paint3d(host,snap){ if(!a||!b)return; a.scale.setScalar(0.8+0.2*Math.abs(Number(snap.values.Vp??0))); b.scale.setScalar(0.8+0.15*Math.abs(Number(snap.values.Vs??0))); host.render() },
    dispose3d(){ a=null;b=null }, dispose(){ this.dispose3d?.() },
  }
}
