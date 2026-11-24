import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

export function createOttoAdapter(): DemoAdapter {
  let line: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: 0, xMax: 14, yMin: 0, yMax: 40 }, W, H)
      const path = snap.trails?.path
      if (path && path.length > 1) {
        ctx.strokeStyle = 'rgba(251,191,36,0.95)'
        ctx.lineWidth = 2.2
        ctx.beginPath()
        for (let i = 0; i < path.length; i++) {
          const p = path[i]!
          if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
          else ctx.lineTo(sx(p[0]!), sy(p[1]!))
        }
        ctx.stroke()
      }
      drawMarker(ctx, sx(Number(snap.values.Vx ?? 0)), sy(Number(snap.values.Px ?? 0)), {
        radius: 5,
        fill: '#f472b6',
      })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `奥托 · η=${(Number(snap.values.eta ?? 0) * 100).toFixed(1)}%  r=${Number(snap.values.r ?? 0).toFixed(1)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, 'P–V：绝热压缩→等容加热→绝热膨胀→等容放热', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [5, 10, 0], yaw: 0.4, pitch: 0.4, distance: 28, distanceMin: 10, distanceMax: 50 })
      line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      host.scene.add(line)
    },
    paint3d(host, snap) {
      const path = snap.trails?.path
      if (line && path?.length) setTrailPositions(line, path.map((p) => [p[0]!, p[1]! * 0.3, 0]))
      host.render()
    },
    dispose3d() {
      line = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
