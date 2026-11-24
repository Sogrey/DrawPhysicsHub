import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createBernoulliAdapter(): DemoAdapter {
  let particle: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.8, xMax: 2.8, yMin: -2, yMax: 2.2 }, W, H)
      const A1 = Number(snap.values.A1 ?? 2)
      const A2 = Number(snap.values.A2 ?? 0.8)
      const h1 = 0.35 * A1
      const h2 = 0.35 * A2
      // 管壁折线
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2.2
      ctx.beginPath()
      ctx.moveTo(sx(-2.4), sy(h1))
      ctx.lineTo(sx(-0.2), sy(h1))
      ctx.lineTo(sx(0.2), sy(h2))
      ctx.lineTo(sx(2.4), sy(h2))
      ctx.moveTo(sx(-2.4), sy(-h1))
      ctx.lineTo(sx(-0.2), sy(-h1))
      ctx.lineTo(sx(0.2), sy(-h2))
      ctx.lineTo(sx(2.4), sy(-h2))
      ctx.stroke()
      drawMarker(ctx, sx(Number(snap.values.x ?? 0)), sy(0), { radius: 5, fill: '#fbbf24', label: '粒子', labelDy: -12 })
      drawDiagramLabel(ctx, `v₁=${Number(snap.values.v1 ?? 0).toFixed(2)}`, sx(-1.3), sy(h1 + 0.35), {
        color: '#7dd3fc',
        font: '11px sans-serif',
      })
      drawDiagramLabel(ctx, `v₂=${Number(snap.values.v2 ?? 0).toFixed(2)}`, sx(1.3), sy(h2 + 0.35), {
        color: '#fde68a',
        font: '11px sans-serif',
      })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `伯努利 · ΔP=${Number(snap.values.dP ?? 0).toFixed(2)}  v₂/v₁=${Number(snap.values.ratio ?? 0).toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '窄处流速大、压强低', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.5, pitch: 0.35, distance: 9, distanceMin: 3, distanceMax: 18 })
      particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 }),
      )
      host.scene.add(particle)
    },
    paint3d(host, snap) {
      if (particle) particle.position.set(Number(snap.values.x ?? 0), 0, 0)
      host.render()
    },
    dispose3d() {
      particle = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
