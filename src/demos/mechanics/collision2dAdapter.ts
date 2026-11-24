import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createCollision2dAdapter(): DemoAdapter {
  let b1: THREE.Mesh | null = null
  let b2: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -3, xMax: 3, yMin: -2.2, yMax: 2.2 }, W, H)
      const R = Number(snap.values.R ?? 0.35)
      const drawBall = (x: number, y: number, color: string) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(sx(x), sy(y), Math.abs(sx(R) - sx(0)), 0, Math.PI * 2)
        ctx.fill()
      }
      drawBall(Number(snap.values.x1 ?? 0), Number(snap.values.y1 ?? 0), '#fbbf24')
      drawBall(Number(snap.values.x2 ?? 0), Number(snap.values.y2 ?? 0), '#38bdf8')
      // 速度箭头（碰撞后）
      if (Number(snap.values.collided ?? 0) > 0.5) {
        const drawV = (x: number, y: number, vx: number, vy: number, color: string) => {
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(sx(x), sy(y))
          ctx.lineTo(sx(x + vx * 0.25), sy(y + vy * 0.25))
          ctx.stroke()
        }
        drawV(
          Number(snap.values.x1 ?? 0),
          Number(snap.values.y1 ?? 0),
          Number(snap.values.v1x ?? 0),
          Number(snap.values.v1y ?? 0),
          '#fde68a',
        )
        drawV(
          Number(snap.values.x2 ?? 0),
          Number(snap.values.y2 ?? 0),
          Number(snap.values.v2x ?? 0),
          Number(snap.values.v2y ?? 0),
          '#7dd3fc',
        )
      }
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `二维碰撞 · b=${Number(snap.values.b ?? 0).toFixed(2)}  θ≈${Number(snap.values.scatter ?? 0).toFixed(0)}°`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '等质量弹性 · 法向速度交换', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.4, pitch: 0.5, distance: 9, distanceMin: 3, distanceMax: 18 })
      b1 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfbbf24 }))
      b2 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }))
      host.scene.add(b1)
      host.scene.add(b2)
    },
    paint3d(host, snap) {
      if (b1) b1.position.set(Number(snap.values.x1 ?? 0), Number(snap.values.y1 ?? 0), 0)
      if (b2) b2.position.set(Number(snap.values.x2 ?? 0), Number(snap.values.y2 ?? 0), 0)
      host.render()
    },
    dispose3d() {
      b1 = null
      b2 = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
