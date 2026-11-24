import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createFaradayDiskAdapter(): DemoAdapter {
  let disk: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.4, xMax: 2.4, yMin: -2, yMax: 2.2 }, W, H)
      const R = Number(snap.values.R ?? 1.2)
      const ang = Number(snap.values.ang ?? 0)
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(sx(0), sy(0), Math.abs(sx(R) - sx(0)), 0, Math.PI * 2)
      ctx.stroke()
      // 辐条
      ctx.beginPath()
      ctx.moveTo(sx(0), sy(0))
      ctx.lineTo(sx(R * Math.cos(ang)), sy(R * Math.sin(ang)))
      ctx.stroke()
      // 电刷
      ctx.fillStyle = '#38bdf8'
      ctx.fillRect(sx(R) - 4, sy(0) - 10, 10, 20)
      ctx.fillRect(sx(-0.08), sy(0) - 6, sx(0.08) - sx(-0.08), 12)
      drawDiagramLabel(ctx, '⊗ B', sx(0), sy(R + 0.35), { color: '#c4b5fd', font: '12px sans-serif' })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `法拉第圆盘 · ε=${Number(snap.values.emf ?? 0).toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, 'ε = ½ B ω R²', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.6, pitch: 0.55, distance: 8, distanceMin: 3, distanceMax: 16 })
      disk = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.08, 32),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.4, roughness: 0.35 }),
      )
      disk.rotation.x = Math.PI / 2
      host.scene.add(disk)
    },
    paint3d(host, snap) {
      if (disk) {
        const R = Number(snap.values.R ?? 1.2)
        disk.scale.set(R / 1.2, 1, R / 1.2)
        disk.rotation.z = Number(snap.values.ang ?? 0)
      }
      host.render()
    },
    dispose3d() {
      disk = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
