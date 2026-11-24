import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createVariableMassAdapter(): DemoAdapter {
  let rocket: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.2, xMax: 2.2, yMin: -0.5, yMax: 2.8 }, W, H)
      const y = Number(snap.values.y ?? 0)
      const thrusting = Number(snap.values.thrusting ?? 0) > 0.5
      // 火箭体
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.moveTo(sx(0), sy(y + 0.55))
      ctx.lineTo(sx(-0.22), sy(y))
      ctx.lineTo(sx(0.22), sy(y))
      ctx.closePath()
      ctx.fill()
      ctx.fillRect(sx(-0.18), sy(y) - 2, sx(0.18) - sx(-0.18), sy(y - 0.55) - sy(y))
      if (thrusting) {
        ctx.fillStyle = 'rgba(244,114,182,0.85)'
        ctx.beginPath()
        ctx.moveTo(sx(-0.12), sy(y - 0.55))
        ctx.lineTo(sx(0.12), sy(y - 0.55))
        ctx.lineTo(sx(0), sy(y - 1.1 - 0.2 * Math.sin(Number(snap.time) * 20)))
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `火箭 · m=${Number(snap.values.m ?? 0).toFixed(2)}  v=${Number(snap.values.v ?? 0).toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, 'v = u ln(m₀/m)', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 1, 0], yaw: 0.5, pitch: 0.4, distance: 8, distanceMin: 3, distanceMax: 16 })
      rocket = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.9, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 }),
      )
      host.scene.add(rocket)
    },
    paint3d(host, snap) {
      if (rocket) rocket.position.set(0, Number(snap.values.y ?? 0), 0)
      host.render()
    },
    dispose3d() {
      rocket = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
