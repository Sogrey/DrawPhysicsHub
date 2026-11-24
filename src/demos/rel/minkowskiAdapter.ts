import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

function strokeTrail(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  path: number[][] | undefined,
  color: string,
  width = 2,
  dash?: number[],
) {
  if (!path || path.length < 2) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  if (dash) ctx.setLineDash(dash)
  ctx.beginPath()
  for (let i = 0; i < path.length; i++) {
    const p = path[i]!
    if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
    else ctx.lineTo(sx(p[0]!), sy(p[1]!))
  }
  ctx.stroke()
  ctx.restore()
}

export function createMinkowskiAdapter(): DemoAdapter {
  let restL: THREE.Line | null = null
  let movL: THREE.Line | null = null
  let light: THREE.Line | null = null
  let event: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -2.8, xMax: 2.8, yMin: -0.3, yMax: 3.4 }, W, H)
      const tr = snap.trails as Record<string, number[][]> | undefined
      strokeTrail(ctx, sx, sy, tr?.lightR, 'rgba(148,163,184,0.55)', 1.4, [5, 4])
      strokeTrail(ctx, sx, sy, tr?.lightL, 'rgba(148,163,184,0.55)', 1.4, [5, 4])
      strokeTrail(ctx, sx, sy, tr?.rest, 'rgba(56,189,248,0.95)', 2.4)
      strokeTrail(ctx, sx, sy, tr?.moving, 'rgba(251,191,36,0.95)', 2.4)
      strokeTrail(ctx, sx, sy, tr?.simRest, 'rgba(226,232,240,0.55)', 1.5, [6, 4])
      strokeTrail(ctx, sx, sy, tr?.simMove, 'rgba(167,139,250,0.95)', 2, [4, 3])
      const x = Number(snap.values.x ?? 0)
      const ct = Number(snap.values.ct ?? 0)
      drawMarker(ctx, sx(x), sy(ct), { radius: 5, fill: '#f472b6', label: '事件', labelDy: -12 })
      drawMarker(ctx, sx(0), sy(ct), { radius: 3.5, fill: '#38bdf8' })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `闵氏图 · β=${Number(snap.values.beta ?? 0).toFixed(2)}  γ=${Number(snap.values.gamma ?? 1).toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '横轴 x · 纵轴 ct（c=1）；紫斜线=运动系同时', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 1.2, 0], yaw: 0.45, pitch: 0.4, distance: 10, distanceMin: 4, distanceMax: 20 })
      restL = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x38bdf8 }))
      movL = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      light = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x94a3b8 }))
      event = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.35 }),
      )
      host.scene.add(restL)
      host.scene.add(movL)
      host.scene.add(light)
      host.scene.add(event)
    },
    paint3d(host, snap) {
      const tr = snap.trails as Record<string, number[][]> | undefined
      if (restL && tr?.rest) setTrailPositions(restL, tr.rest.map((p) => [p[0]!, p[1]!, 0]))
      if (movL && tr?.moving) setTrailPositions(movL, tr.moving.map((p) => [p[0]!, p[1]!, 0]))
      if (light && tr?.lightR && tr?.lightL) {
        setTrailPositions(light, [...tr.lightL, ...tr.lightR].map((p) => [p[0]!, p[1]!, 0]))
      }
      if (event) {
        event.position.set(Number(snap.values.x ?? 0), Number(snap.values.ct ?? 0), 0)
      }
      host.render()
    },
    dispose3d() {
      restL = null
      movL = null
      light = null
      event = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
