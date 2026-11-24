import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
export function createSternGerlachAdapter(): DemoAdapter {
  let up: THREE.Line|null=null; let dn: THREE.Line|null=null
  return {
    paint2d(host:Canvas2DHost,snap:ObserveSnapshot,_c:DemoAdapterContext){
      const {ctx,canvas}=host; const W=canvas.clientWidth,H=canvas.clientHeight; host.clear(); fillDarkViewport(ctx,W,H)
      const {sx,sy}=drawGridAndAxes2D(ctx,{xMin:-3,xMax:3,yMin:-2.5,yMax:2.5},W,H)
      ctx.fillStyle='rgba(100,116,139,0.4)'; ctx.fillRect(sx(-0.4),sy(1.6),sx(0.4)-sx(-0.4),sy(-1.6)-sy(1.6))
      const drawP=(pts:number[][]|undefined,col:string)=>{ if(!pts||pts.length<2)return; ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.beginPath(); for(let i=0;i<pts.length;i++){ const p=pts[i]!; if(i===0)ctx.moveTo(sx(p[0]!),sy(p[1]!)); else ctx.lineTo(sx(p[0]!),sy(p[1]!)) } ctx.stroke() }
      drawP(snap.trails?.path,'rgba(56,189,248,0.95)'); drawP(snap.trails?.pathB,'rgba(244,114,182,0.95)')
      drawMarker(ctx,sx(Number(snap.values.x??0)),sy(Number(snap.values.sep??0)),{radius:5,fill:'#38bdf8',label:''})
      drawMarker(ctx,sx(Number(snap.values.x??0)),sy(-Number(snap.values.sep??0)),{radius:5,fill:'#f472b6',label:''})
      ctx.fillStyle='rgba(15,23,42,0.92)'; ctx.fillRect(12,10,Math.min(460,W-24),48)
      drawDiagramLabel(ctx,`Stern–Gerlach · 分离=${Number(snap.values.sep??0).toFixed(2)}`,22,28,{color:'#e9d5ff',font:'bold 13px sans-serif'})
      drawDiagramLabel(ctx,'灰区=磁铁；两束而非连续扇',22,46,{color:'rgba(226,232,240,0.88)',font:'11px sans-serif'})
    },
    setup3d(host:ThreeHost){ host.setViewDefaults({lookAt:[0,0,0],yaw:0.5,pitch:0.45,distance:10,distanceMin:4,distanceMax:20}); up=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x38bdf8})); dn=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xf472b6})); host.scene.add(up,dn) },
    paint3d(host,snap){ if(!up||!dn)return; if(snap.trails?.path) setTrailPositions(up,snap.trails.path.map(p=>[p[0]!,p[1]!,0])); if(snap.trails?.pathB) setTrailPositions(dn,snap.trails.pathB.map(p=>[p[0]!,p[1]!,0])); host.render() },
    dispose3d(){ up=null; dn=null }, dispose(){ this.dispose3d?.() },
  }
}
