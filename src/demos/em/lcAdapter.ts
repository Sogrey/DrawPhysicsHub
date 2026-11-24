import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

export function createLcAdapter(): DemoAdapter {
  let line: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.8, xMax: 2.8, yMin: -2.2, yMax: 2.4 }, W, H)
      // 简易 LC 符号
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.strokeRect(sx(-2.2), sy(0.5), sx(-1.4) - sx(-2.2), sy(-0.5) - sy(0.5))
      drawDiagramLabel(ctx, 'C', sx(-1.8), sy(0.75), { color: '#38bdf8', font: '11px sans-serif' })
      // 电感螺旋示意
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const x0 = -0.6 + i * 0.35
        ctx.moveTo(sx(x0), sy(-0.35))
        ctx.quadraticCurveTo(sx(x0 + 0.1), sy(0.45), sx(x0 + 0.25), sy(-0.35))
      }
      ctx.stroke()
      drawDiagramLabel(ctx, 'L', sx(0.2), sy(0.75), { color: '#fbbf24', font: '11px sans-serif' })
      // 相轨
      const path = snap.trails?.path
      if (path && path.length > 1) {
        const iMax = Math.max(0.5, ...path.map((p) => Math.abs(p[1]!)))
        ctx.strokeStyle = 'rgba(167,139,250,0.85)'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        for (let i = 0; i < path.length; i++) {
          const p = path[i]!
          const x = 1.2 + p[0]! * 0.9
          const y = (p[1]! / iMax) * 1.2
          if (i === 0) ctx.moveTo(sx(x), sy(y))
          else ctx.lineTo(sx(x), sy(y))
        }
        ctx.stroke()
        const q = Number(snap.values.q ?? 0)
        const ii = Number(snap.values.i ?? 0)
        drawMarker(ctx, sx(1.2 + q * 0.9), sy((ii / iMax) * 1.2), { radius: 4, fill: '#f472b6' })
      }
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `LC · ω₀=${Number(snap.values.w0 ?? 0).toFixed(2)}  q=${Number(snap.values.q ?? 0).toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '右=(q,i) 相轨；电能⇔磁能', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.4, pitch: 0.4, distance: 9, distanceMin: 3, distanceMax: 18 })
      line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xa78bfa }))
      host.scene.add(line)
    },
    paint3d(host, snap) {
      const path = snap.trails?.path
      if (line && path?.length) {
        const iMax = Math.max(0.5, ...path.map((p) => Math.abs(p[1]!)))
        setTrailPositions(
          line,
          path.map((p) => [p[0]!, p[1]! / iMax, 0]),
        )
      }
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
