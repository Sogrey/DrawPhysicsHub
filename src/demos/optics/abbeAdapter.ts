import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

export function createAbbeAdapter(): DemoAdapter {
  let line: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.4, xMax: 2.4, yMin: -0.2, yMax: 2.2 }, W, H)
      const path = snap.trails?.path
      const ymax = Math.max(0.5, ...(path?.map((p) => p[1]!) ?? [1]))
      if (path && path.length > 1) {
        ctx.strokeStyle = 'rgba(251,191,36,0.95)'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < path.length; i++) {
          const p = path[i]!
          if (i === 0) ctx.moveTo(sx(p[0]!), sy((p[1]! / ymax) * 1.8))
          else ctx.lineTo(sx(p[0]!), sy((p[1]! / ymax) * 1.8))
        }
        ctx.stroke()
      }
      const d = Number(snap.values.d ?? 0)
      ctx.strokeStyle = 'rgba(167,139,250,0.8)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(sx(-d / 2), sy(0))
      ctx.lineTo(sx(-d / 2), sy(2))
      ctx.moveTo(sx(d / 2), sy(0))
      ctx.lineTo(sx(d / 2), sy(2))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `阿贝 · d=${d.toFixed(2)}  ${Number(snap.values.resolved ?? 0) > 0.5 ? '可分辨' : '不可分辨'}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, 'd ≈ λ/(2 NA)', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0.6, 0], yaw: 0.4, pitch: 0.4, distance: 9, distanceMin: 3, distanceMax: 18 })
      line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      host.scene.add(line)
    },
    paint3d(host, snap) {
      const path = snap.trails?.path
      const ymax = Math.max(0.5, ...(path?.map((p) => p[1]!) ?? [1]))
      if (line && path?.length) setTrailPositions(line, path.map((p) => [p[0]!, (p[1]! / ymax) * 1.5, 0]))
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
