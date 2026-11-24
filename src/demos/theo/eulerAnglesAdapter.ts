import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawArrow, drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createEulerAnglesAdapter(): DemoAdapter {
  let axis: THREE.ArrowHelper | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2, xMax: 2, yMin: -0.5, yMax: 2.4 }, W, H)
      const tx = Number(snap.values.tipX ?? 0)
      const ty = Number(snap.values.tipY ?? 1)
      drawArrow(ctx, sx(0), sy(0), sx(tx * 1.4), sy(ty * 1.4), '#fbbf24', 2.5)
      ctx.strokeStyle = 'rgba(56,189,248,0.5)'
      ctx.beginPath()
      ctx.ellipse(sx(0), sy(0), Math.abs(sx(1.2) - sx(0)), Math.abs(sy(0.35) - sy(0)), 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `欧拉角 · φ=${Number(snap.values.phi ?? 0).toFixed(2)} θ=${Number(snap.values.theta ?? 0).toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '金箭头=体轴；青椭圆=进动示意', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0.6, 0], yaw: 0.7, pitch: 0.45, distance: 7, distanceMin: 3, distanceMax: 14 })
      axis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1.6, 0xfbbf24, 0.2, 0.12)
      host.scene.add(axis)
    },
    paint3d(host, snap) {
      if (axis) {
        const x = Number(snap.values.tipX ?? 0)
        const y = Number(snap.values.tipY ?? 1)
        const z = Number(snap.values.tipZ ?? 0)
        const v = new THREE.Vector3(x, y, z)
        if (v.length() > 1e-6) axis.setDirection(v.normalize())
      }
      host.render()
    },
    dispose3d() {
      axis = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
