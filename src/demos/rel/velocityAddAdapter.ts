import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawArrow, drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

function strokePath(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  path: number[][] | undefined,
  color: string,
  width: number,
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

export function createVelocityAddAdapter(): DemoAdapter {
  let relLine: THREE.Line | null = null
  let classLine: THREE.Line | null = null
  let marker: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -1.15, xMax: 1.15, yMin: -1.15, yMax: 1.25 }, W, H)
      const tr = snap.trails as Record<string, number[][]> | undefined
      strokePath(ctx, sx, sy, tr?.classicalPath, 'rgba(244,114,182,0.55)', 1.6, [5, 4])
      strokePath(ctx, sx, sy, tr?.path, 'rgba(251,191,36,0.95)', 2.2)
      const u = Number(snap.values.u ?? 0)
      const vProbe = Number(snap.values.vProbe ?? 0)
      const wProbe = Number(snap.values.wProbe ?? 0)
      const classicalProbe = Number(snap.values.classicalProbe ?? 0)
      // 光速界
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(sx(-1.1), sy(1))
      ctx.lineTo(sx(1.1), sy(1))
      ctx.moveTo(sx(-1.1), sy(-1))
      ctx.lineTo(sx(1.1), sy(-1))
      ctx.stroke()
      ctx.setLineDash([])
      drawArrow(ctx, sx(0), sy(-0.95), sx(u), sy(-0.95), '#38bdf8', 2)
      drawMarker(ctx, sx(vProbe), sy(wProbe), { radius: 5, fill: '#fbbf24' })
      drawMarker(ctx, sx(vProbe), sy(classicalProbe), { radius: 3.5, fill: '#f472b6' })
      // 用户设定的 (v,w) 参考
      drawMarker(ctx, sx(Number(snap.values.v ?? 0)), sy(Number(snap.values.w ?? 0)), {
        radius: 4,
        fill: '#a78bfa',
      })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(520, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `速度合成 · u=${u.toFixed(2)}  v探针=${vProbe.toFixed(2)}  w=${wProbe.toFixed(3)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '金=相对论 · 粉虚线=经典 · 播放扫 v；紫点=参数 (v,w)', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.5,
        pitch: 0.35,
        distance: 6.5,
        distanceMin: 3,
        distanceMax: 14,
      })
      relLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      classLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineDashedMaterial({ color: 0xf472b6, dashSize: 0.12, gapSize: 0.08 }),
      )
      marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.35 }),
      )
      host.scene.add(relLine)
      host.scene.add(classLine)
      host.scene.add(marker)
    },
    paint3d(host, snap) {
      const tr = snap.trails as Record<string, number[][]> | undefined
      if (relLine && tr?.path) setTrailPositions(relLine, tr.path.map((p) => [p[0]!, p[1]!, 0]))
      if (classLine && tr?.classicalPath) {
        setTrailPositions(
          classLine,
          tr.classicalPath.map((p) => [p[0]!, Math.max(-1.4, Math.min(1.4, p[1]!)), 0]),
        )
      }
      if (marker) {
        marker.position.set(Number(snap.values.vProbe ?? 0), Number(snap.values.wProbe ?? 0), 0)
      }
      host.render()
    },
    dispose3d() {
      relLine = null
      classLine = null
      marker = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
