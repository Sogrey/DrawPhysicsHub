import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

const Y_SCALE = 0.05

export function createNuclearDecayAdapter(): DemoAdapter {
  let line: THREE.Line | null = null
  let half: THREE.Line | null = null
  let marker: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const N0 = Number(snap.values.N0 ?? 100)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -0.4, xMax: 10.4, yMin: -N0 * 0.06, yMax: N0 * 1.12 }, W, H)
      const path = snap.trails?.path
      if (path && path.length > 1) {
        ctx.strokeStyle = 'rgba(251,191,36,0.95)'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < path.length; i++) {
          const p = path[i]!
          if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
          else ctx.lineTo(sx(p[0]!), sy(p[1]!))
        }
        ctx.stroke()
      }
      const T12 = Number(snap.values.T12 ?? 0)
      ctx.strokeStyle = 'rgba(167,139,250,0.8)'
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(sx(T12), sy(0))
      ctx.lineTo(sx(T12), sy(N0))
      ctx.stroke()
      ctx.setLineDash([])
      drawMarker(ctx, sx(Number(snap.time ?? 0)), sy(Number(snap.values.N ?? 0)), {
        radius: 5,
        fill: '#f472b6',
      })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `衰变 · N=${Number(snap.values.N ?? 0).toFixed(1)}  T½=${T12.toFixed(2)}s`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '紫虚线 = 半衰期', 22, 46, { color: 'rgba(226,232,240,0.88)', font: '11px sans-serif' })
    },
    setup3d(host: ThreeHost) {
      // 曲线：x∈[0,10]，y=N*0.05 ∈[0,~5] — lookAt 对准曲线中心
      host.setViewDefaults({
        lookAt: [5, 2.4, 0],
        yaw: 0.55,
        pitch: 0.32,
        distance: 13,
        distanceMin: 5,
        distanceMax: 28,
      })
      line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      half = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineDashedMaterial({ color: 0xa78bfa, dashSize: 0.25, gapSize: 0.15 }),
      )
      marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.35 }),
      )
      host.scene.add(line)
      host.scene.add(half)
      host.scene.add(marker)
    },
    paint3d(host, snap) {
      const path = snap.trails?.path
      const N0 = Number(snap.values.N0 ?? 100)
      const T12 = Number(snap.values.T12 ?? 0)
      if (line && path?.length) {
        setTrailPositions(
          line,
          path.map((p) => [p[0]!, p[1]! * Y_SCALE, 0]),
        )
      }
      if (half) {
        setTrailPositions(half, [
          [T12, 0, 0],
          [T12, N0 * Y_SCALE, 0],
        ])
      }
      if (marker) {
        marker.position.set(Number(snap.time ?? 0), Number(snap.values.N ?? 0) * Y_SCALE, 0)
      }
      host.render()
    },
    dispose3d() {
      line = null
      half = null
      marker = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
