import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createAtwoodAdapter(): DemoAdapter {
  let m1m: THREE.Mesh | null = null
  let m2m: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.5, xMax: 2.5, yMin: -2, yMax: 2.2 }, W, H)
      const y = Number(snap.values.y ?? 0)
      const yOpp = Number(snap.values.yOpp ?? 0)
      // 滑轮
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(sx(0), sy(1.6), 18, 0, Math.PI * 2)
      ctx.stroke()
      // 绳
      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx(-0.7), sy(1.6))
      ctx.lineTo(sx(-0.7), sy(yOpp))
      ctx.moveTo(sx(0.7), sy(1.6))
      ctx.lineTo(sx(0.7), sy(y))
      ctx.stroke()
      // 质量块
      const drawMass = (x: number, yy: number, color: string, label: string) => {
        ctx.fillStyle = color
        ctx.fillRect(sx(x) - 18, sy(yy) - 18, 36, 36)
        drawDiagramLabel(ctx, label, sx(x), sy(yy) + 28, { color: '#e2e8f0', font: '11px sans-serif' })
      }
      drawMass(-0.7, yOpp, '#38bdf8', `m₁=${Number(snap.values.m1 ?? 0).toFixed(1)}`)
      drawMass(0.7, y, '#fbbf24', `m₂=${Number(snap.values.m2 ?? 0).toFixed(1)}`)
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `阿特伍德 · a=${Number(snap.values.a ?? 0).toFixed(2)}  T=${Number(snap.values.T ?? 0).toFixed(1)} N`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, 'm₂ 侧向下为正 a', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0.4, 0], yaw: 0.4, pitch: 0.35, distance: 8, distanceMin: 3, distanceMax: 16 })
      m1m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }))
      m2m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xfbbf24 }))
      host.scene.add(m1m)
      host.scene.add(m2m)
    },
    paint3d(host, snap) {
      if (m1m) m1m.position.set(-0.7, Number(snap.values.yOpp ?? 0), 0)
      if (m2m) m2m.position.set(0.7, Number(snap.values.y ?? 0), 0)
      host.render()
    },
    dispose3d() {
      m1m = null
      m2m = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
