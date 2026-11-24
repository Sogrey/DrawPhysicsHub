import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createTennisRacketAdapter(): DemoAdapter {
  let body: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.2, xMax: 2.2, yMin: -2, yMax: 2.2 }, W, H)
      const ang = Number(snap.values.ang ?? 0)
      const eps = Number(snap.values.eps ?? 0)
      const flip = Number(snap.values.flip ?? 0) > 0.5
      ctx.save()
      ctx.translate(sx(0), sy(0))
      ctx.rotate(ang + (flip ? Math.PI : 0) + eps * 0.8)
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(-50, -14, 100, 28)
      ctx.fillStyle = '#38bdf8'
      ctx.fillRect(-8, -40, 16, 26)
      ctx.restore()
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `网球拍 · 轴=${Number(snap.values.axis ?? 0)}  ε=${eps.toFixed(2)}${flip ? ' 翻转!' : ''}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '中间主轴自旋不稳定', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.6, pitch: 0.4, distance: 7, distanceMin: 3, distanceMax: 14 })
      body = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.35, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 }),
      )
      host.scene.add(body)
    },
    paint3d(host, snap) {
      if (body) {
        body.rotation.z = Number(snap.values.ang ?? 0)
        body.rotation.x = Number(snap.values.eps ?? 0)
      }
      host.render()
    },
    dispose3d() {
      body = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
