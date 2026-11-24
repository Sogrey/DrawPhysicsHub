import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

export function createRabiAdapter(): DemoAdapter {
  let line: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -0.5, xMax: 8.5, yMin: -0.1, yMax: 1.2 }, W, H)
      const path = snap.trails?.path
      if (path && path.length > 1) {
        ctx.strokeStyle = 'rgba(251,191,36,0.95)'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < path.length; i++) {
          const p = path[i]!
          if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
          else ctx.lineTo(sx(p[0]!), sy(p[1]!))
        }
        ctx.stroke()
      }
      const Pe = Number(snap.values.Pe ?? 0)
      const Pg = Number(snap.values.Pg ?? 0)
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(sx(7.2), sy(Pe), sx(7.6) - sx(7.2), sy(0) - sy(Pe))
      ctx.fillStyle = '#38bdf8'
      ctx.fillRect(sx(7.7), sy(Pg), sx(8.1) - sx(7.7), sy(0) - sy(Pg))
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(ctx, `拉比 · Pe=${Pe.toFixed(2)}  Ω=${Number(snap.values.Omega ?? 0).toFixed(1)}`, 22, 28, {
        color: '#fde68a',
        font: 'bold 13px sans-serif',
      })
      drawDiagramLabel(ctx, 'Pe = sin²(Ωt/2)', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [4, 0.5, 0], yaw: 0.35, pitch: 0.4, distance: 12, distanceMin: 4, distanceMax: 24 })
      line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      host.scene.add(line)
    },
    paint3d(host, snap) {
      const path = snap.trails?.path
      if (line && path?.length) setTrailPositions(line, path.map((p) => [p[0]!, p[1]!, 0]))
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
