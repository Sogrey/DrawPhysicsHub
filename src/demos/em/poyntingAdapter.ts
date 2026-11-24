import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawArrow, drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createPoyntingAdapter(): DemoAdapter {
  let arrowE: THREE.ArrowHelper | null = null
  let arrowB: THREE.ArrowHelper | null = null
  let arrowS: THREE.ArrowHelper | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.5, xMax: 2.5, yMin: -2, yMax: 2.2 }, W, H)
      const x = Number(snap.values.x ?? 0)
      const E = Number(snap.values.E ?? 0)
      const B = Number(snap.values.B ?? 0)
      const Sabs = Number(snap.values.Sabs ?? 0)
      drawArrow(ctx, sx(x), sy(0), sx(x), sy(E * 0.9), '#38bdf8', 2.5)
      drawArrow(ctx, sx(x), sy(0), sx(x + B * 0.5), sy(0), '#a78bfa', 2.5)
      drawArrow(ctx, sx(x), sy(0), sx(x + 0.9 + 0.4 * Sabs), sy(0.15), '#fbbf24', 2.5)
      drawDiagramLabel(ctx, 'E', sx(x + 0.15), sy(E * 0.9 + 0.15), { color: '#7dd3fc', font: '11px sans-serif' })
      drawDiagramLabel(ctx, 'B', sx(x + B * 0.5 + 0.1), sy(-0.25), { color: '#c4b5fd', font: '11px sans-serif' })
      drawDiagramLabel(ctx, 'S', sx(x + 1.1), sy(0.4), { color: '#fde68a', font: '11px sans-serif' })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `坡印廷 · |S|=${Sabs.toFixed(2)}  E=${E.toFixed(2)} B=${B.toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, 'S = E×B（教学 μ₀=1）沿传播方向', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0.3, 0], yaw: 0.7, pitch: 0.4, distance: 9, distanceMin: 3, distanceMax: 18 })
      arrowE = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1, 0x38bdf8, 0.2, 0.12)
      arrowB = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 1, 0xa78bfa, 0.2, 0.12)
      arrowS = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1.2, 0xfbbf24, 0.2, 0.12)
      host.scene.add(arrowE)
      host.scene.add(arrowB)
      host.scene.add(arrowS)
    },
    paint3d(host, snap) {
      const x = Number(snap.values.x ?? 0)
      const E = Number(snap.values.E ?? 0)
      const B = Number(snap.values.B ?? 0)
      const Sabs = Number(snap.values.Sabs ?? 0)
      if (arrowE) {
        arrowE.position.set(x, 0, 0)
        arrowE.setLength(Math.max(0.15, Math.abs(E)), 0.15, 0.1)
        arrowE.setDirection(new THREE.Vector3(0, Math.sign(E) || 1, 0))
      }
      if (arrowB) {
        arrowB.position.set(x, 0, 0)
        arrowB.setLength(Math.max(0.15, Math.abs(B)), 0.15, 0.1)
        arrowB.setDirection(new THREE.Vector3(0, 0, Math.sign(B) || 1))
      }
      if (arrowS) {
        arrowS.position.set(x, 0, 0)
        arrowS.setLength(0.6 + 0.6 * Sabs, 0.15, 0.1)
      }
      host.render()
    },
    dispose3d() {
      arrowE = null
      arrowB = null
      arrowS = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
