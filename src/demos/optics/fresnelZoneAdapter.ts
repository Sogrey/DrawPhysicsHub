import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createFresnelZoneAdapter(): DemoAdapter {
  let rings: THREE.Mesh[] = []

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.5, xMax: 2.5, yMin: -2.2, yMax: 2.4 }, W, H)
      const path = snap.trails?.path
      const live = Number(snap.values.live ?? 1)
      const scale = 1.6 / Math.max(0.4, Number(path?.[path.length - 1]?.[1] ?? 1))
      if (path) {
        for (let i = path.length - 1; i >= 0; i--) {
          const m = path[i]![0]!
          if (m > live) continue
          const r = path[i]![1]! * scale
          ctx.beginPath()
          ctx.arc(sx(0), sy(0), Math.abs(sx(r) - sx(0)), 0, Math.PI * 2)
          ctx.fillStyle = m % 2 === 1 ? 'rgba(251,191,36,0.45)' : 'rgba(15,23,42,0.85)'
          ctx.fill()
          ctx.strokeStyle = 'rgba(148,163,184,0.5)'
          ctx.stroke()
        }
      }
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(ctx, `菲涅耳波带 · 点亮 ${live} 带  r₁=${Number(snap.values.r1 ?? 0).toFixed(2)}`, 22, 28, {
        color: '#fde68a',
        font: 'bold 13px sans-serif',
      })
      drawDiagramLabel(ctx, 'ρ_m ≈ √(m λ b)', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.4, pitch: 0.6, distance: 8, distanceMin: 3, distanceMax: 16 })
      for (let i = 0; i < 8; i++) {
        const mesh = new THREE.Mesh(
          new THREE.RingGeometry(0.2 + i * 0.2, 0.35 + i * 0.2, 48),
          new THREE.MeshBasicMaterial({ color: i % 2 ? 0xfbbf24 : 0x1e293b, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }),
        )
        mesh.rotation.x = -Math.PI / 2
        rings.push(mesh)
        host.scene.add(mesh)
      }
    },
    paint3d(host, snap) {
      const live = Number(snap.values.live ?? 1)
      rings.forEach((r, i) => {
        r.visible = i < live
      })
      host.render()
    },
    dispose3d() {
      rings = []
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
