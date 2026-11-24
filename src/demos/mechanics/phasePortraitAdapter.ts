import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

export function createPhasePortraitAdapter(): DemoAdapter {
  let line: THREE.Line | null = null
  let dot: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -3.2, xMax: 3.2, yMin: -3.2, yMax: 3.2 }, W, H)
      const path = snap.trails?.path
      if (path && path.length > 1) {
        ctx.strokeStyle = 'rgba(56,189,248,0.85)'
        ctx.lineWidth = 1.8
        ctx.beginPath()
        for (let i = 0; i < path.length; i++) {
          const p = path[i]!
          if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
          else ctx.lineTo(sx(p[0]!), sy(p[1]!))
        }
        ctx.stroke()
      }
      drawMarker(ctx, sx(Number(snap.values.x ?? 0)), sy(Number(snap.values.v ?? 0)), {
        radius: 5,
        fill: '#fbbf24',
        label: '(x,v)',
        labelDy: -12,
      })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `相图 · μ=${Number(snap.values.mu ?? 0).toFixed(1)}  x=${Number(snap.values.x ?? 0).toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '横轴 x · 纵轴 v（范德波尔极限环）', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.4, pitch: 0.45, distance: 10, distanceMin: 4, distanceMax: 20 })
      line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x38bdf8 }))
      dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 }),
      )
      host.scene.add(line)
      host.scene.add(dot)
    },
    paint3d(host, snap) {
      const path = snap.trails?.path
      if (line && path?.length) setTrailPositions(line, path.map((p) => [p[0]!, p[1]!, 0]))
      if (dot) dot.position.set(Number(snap.values.x ?? 0), Number(snap.values.v ?? 0), 0)
      host.render()
    },
    dispose3d() {
      line = null
      dot = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
