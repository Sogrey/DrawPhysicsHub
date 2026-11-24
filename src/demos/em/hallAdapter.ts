import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawArrow, drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createHallAdapter(): DemoAdapter {
  let carrier: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.5, xMax: 2.5, yMin: -2, yMax: 2.2 }, W, H)
      // 样品条
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2
      ctx.strokeRect(sx(-1.8), sy(0.9), sx(1.8) - sx(-1.8), sy(-0.9) - sy(0.9))
      drawArrow(ctx, sx(-2.1), sy(0), sx(-1.85), sy(0), '#38bdf8', 2)
      drawDiagramLabel(ctx, 'I', sx(-2.2), sy(0.25), { color: '#7dd3fc', font: '11px sans-serif' })
      // B × 记号
      ctx.fillStyle = '#a78bfa'
      ctx.beginPath()
      ctx.arc(sx(0), sy(1.5), 10, 0, Math.PI * 2)
      ctx.fill()
      drawDiagramLabel(ctx, `B=${Number(snap.values.B ?? 0).toFixed(1)}`, sx(0.35), sy(1.55), {
        color: '#c4b5fd',
        font: '11px sans-serif',
      })
      const defl = Number(snap.values.defl ?? 0)
      drawMarker(ctx, sx(Number(snap.values.drift ?? 0)), sy(defl), { radius: 5, fill: '#fbbf24' })
      // 霍尔电极
      ctx.fillStyle = Number(snap.values.VH ?? 0) >= 0 ? '#f472b6' : '#38bdf8'
      ctx.fillRect(sx(-0.15), sy(0.9) - 4, sx(0.15) - sx(-0.15), 8)
      ctx.fillRect(sx(-0.15), sy(-0.9) - 4, sx(0.15) - sx(-0.15), 8)
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `霍尔 · VH=${Number(snap.values.VH ?? 0).toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '载流子偏转 → 横向电压', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.5, pitch: 0.4, distance: 8, distanceMin: 3, distanceMax: 16 })
      carrier = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 }),
      )
      host.scene.add(carrier)
    },
    paint3d(host, snap) {
      if (carrier) {
        carrier.position.set(Number(snap.values.drift ?? 0), Number(snap.values.defl ?? 0), 0)
      }
      host.render()
    },
    dispose3d() {
      carrier = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
