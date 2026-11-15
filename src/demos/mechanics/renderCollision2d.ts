import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  drawTrailPolyline,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function collisionWorldBounds(snap: ObserveSnapshot): WorldBounds {
  const x1 = Number(snap.values.x1 ?? -3)
  const x2 = Number(snap.values.x2 ?? 2)
  const r1 = Number(snap.values.r1 ?? 0.4)
  const r2 = Number(snap.values.r2 ?? 0.4)
  const lo = Math.min(x1 - r1, x2 - r2, -5)
  const hi = Math.max(x1 + r1, x2 + r2, 5)
  const pad = Math.max(1.2, (hi - lo) * 0.12)
  return {
    xMin: lo - pad,
    xMax: hi + pad,
    yMin: -2.2,
    yMax: 2.4,
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  x: number,
  r: number,
  color: string,
  label: string,
) {
  const px = sx(x)
  const py = sy(0)
  const pr = Math.abs(sx(x + r) - sx(x))
  ctx.fillStyle = color
  ctx.globalAlpha = 0.22
  ctx.beginPath()
  ctx.arc(px, py, pr * 1.35, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(px, py, pr, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = 'rgba(226,232,240,0.9)'
  ctx.font = '12px "Segoe UI", sans-serif'
  ctx.fillText(label, px - 6, py - pr - 6)
}

export function drawCollisionFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
  opts?: { compare?: CompareTrail | null },
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const { sx, sy, ox, oy } = drawGridAndAxes2D(ctx, world, W, H)
  const map = { sx, sy }

  // floor
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), oy)
  ctx.lineTo(sx(world.xMax), oy)
  ctx.stroke()
  ctx.setLineDash([])

  const path1 = snap.trails?.path1 ?? []
  const path2 = snap.trails?.path2 ?? []
  if (path1.length > 1) drawTrailPolyline(ctx, path1, map, { strokeStyle: 'rgba(56,189,248,0.55)', lineWidth: 2 })
  if (path2.length > 1) drawTrailPolyline(ctx, path2, map, { strokeStyle: 'rgba(249,115,22,0.55)', lineWidth: 2 })

  if (opts?.compare?.path?.length) {
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.75)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(sx(opts.compare.path[0]![0]!), sy(0))
    for (let i = 1; i < opts.compare.path.length; i++) {
      ctx.lineTo(sx(opts.compare.path[i]![0]!), sy(0))
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  const x1 = Number(snap.values.x1 ?? 0)
  const x2 = Number(snap.values.x2 ?? 0)
  const r1 = Number(snap.values.r1 ?? 0.4)
  const r2 = Number(snap.values.r2 ?? 0.4)
  const v1 = Number(snap.values.v1 ?? 0)
  const v2 = Number(snap.values.v2 ?? 0)

  drawBall(ctx, sx, sy, x1, r1, '#38bdf8', '1')
  drawBall(ctx, sx, sy, x2, r2, '#f97316', '2')

  // velocity ticks
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx(x1), sy(0))
  ctx.lineTo(sx(x1 + v1 * 0.18), sy(0))
  ctx.stroke()
  ctx.strokeStyle = '#fbbf24'
  ctx.beginPath()
  ctx.moveTo(sx(x2), sy(0))
  ctx.lineTo(sx(x2 + v2 * 0.18), sy(0))
  ctx.stroke()

  if (Number(snap.values.collided ?? 0) === 1) {
    const mid = (x1 + x2) / 2
    drawMarker(ctx, sx(mid), sy(0.9), {
      radius: 3,
      fill: '#a78bfa',
      label: '已碰撞',
      labelDy: -10,
    })
  }

  drawMarker(ctx, ox, oy, { radius: 2.5, fill: 'rgba(148,163,184,0.85)', label: 'O' })

  const m1 = Number(snap.values.m1 ?? 1)
  const m2 = Number(snap.values.m2 ?? 1)
  const u1 = Number(snap.values.u1 ?? 0)
  const u2 = Number(snap.values.u2 ?? 0)
  drawDiagramLabel(ctx, `m₁=${m1.toFixed(1)} kg  u₁=${u1.toFixed(1)}`, sx(x1), sy(1.15), {
    color: 'rgba(56, 189, 248, 0.95)',
    align: 'center',
  })
  drawDiagramLabel(ctx, `m₂=${m2.toFixed(1)} kg  u₂=${u2.toFixed(1)}`, sx(x2), sy(1.15), {
    color: 'rgba(249, 115, 22, 0.95)',
    align: 'center',
  })
  drawDiagramLabel(
    ctx,
    `v₁=${v1.toFixed(2)}  v₂=${v2.toFixed(2)} m/s`,
    sx((x1 + x2) / 2),
    sy(-1.35),
    { color: 'rgba(226, 232, 240, 0.85)', align: 'center' },
  )
}
