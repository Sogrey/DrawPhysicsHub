import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createFiberAdapter(): DemoAdapter {
  let bead: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.6, xMax: 2.6, yMin: -1.8, yMax: 2 }, W, H)
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2
      ctx.strokeRect(sx(-2.3), sy(0.7), sx(2.3) - sx(-2.3), sy(-0.7) - sy(0.7))
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.strokeRect(sx(-2.3), sy(0.45), sx(2.3) - sx(-2.3), sy(-0.45) - sy(0.45))
      const guided = Number(snap.values.guided ?? 0) > 0.5
      // 示意锯齿
      ctx.strokeStyle = guided ? '#fbbf24' : '#f472b6'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i <= 40; i++) {
        const u = i / 40
        const x = -2 + 4 * u
        const y = (guided ? 0.55 : 1.0) * Math.sin(Math.PI * 3 * u)
        if (i === 0) ctx.moveTo(sx(x), sy(y))
        else ctx.lineTo(sx(x), sy(y))
      }
      ctx.stroke()
      drawMarker(ctx, sx(Number(snap.values.x ?? 0)), sy(Number(snap.values.y ?? 0)), { radius: 4, fill: '#fde68a' })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `光纤 · θc=${Number(snap.values.tc ?? 0).toFixed(1)}°  ${guided ? '导光' : '逸出'}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '界面角 > θc → 全反射', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.5, pitch: 0.35, distance: 9, distanceMin: 3, distanceMax: 18 })
      bead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfbbf24 }))
      host.scene.add(bead)
    },
    paint3d(host, snap) {
      if (bead) bead.position.set(Number(snap.values.x ?? 0), Number(snap.values.y ?? 0), 0)
      host.render()
    },
    dispose3d() {
      bead = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
