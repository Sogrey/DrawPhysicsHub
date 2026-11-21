import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDashedPath,
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function cyclotronWorldBounds(world: number): WorldBounds {
  return {
    xMin: -world,
    xMax: world,
    yMin: -world,
    yMax: world,
  }
}

function drawBFieldMarks(
  ctx: CanvasRenderingContext2D,
  world: WorldBounds,
  sx: (x: number) => number,
  sy: (y: number) => number,
  outOfPage: boolean,
): void {
  const step = Math.max(0.9, (world.xMax - world.xMin) / 8)
  ctx.save()
  for (let x = Math.ceil(world.xMin / step) * step; x <= world.xMax; x += step) {
    for (let y = Math.ceil(world.yMin / step) * step; y <= world.yMax; y += step) {
      if (Math.hypot(x, y) < 0.35) continue
      const px = sx(x)
      const py = sy(y)
      if (outOfPage) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'
        ctx.beginPath()
        ctx.arc(px, py, 1.8, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        const s = 4
        ctx.beginPath()
        ctx.moveTo(px - s, py - s)
        ctx.lineTo(px + s, py + s)
        ctx.moveTo(px + s, py - s)
        ctx.lineTo(px - s, py + s)
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}

export function drawCyclotronFrame(
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

  const { sx, sy, ox, oy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })
  const map = { sx, sy }

  const Bout = Number(snap.values.Bout ?? 1) >= 0.5
  const B = Number(snap.values.B ?? 1)
  const R = Number(snap.values.R ?? 2)
  drawBFieldMarks(ctx, world, sx, sy, Bout)

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(251, 191, 36, 0.75)',
      label: opts.compare.label,
    })
  }

  const trail = snap.trails?.path
  if (trail && trail.length > 1) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(sx(trail[0]![0]!), sy(trail[0]![1]!))
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(sx(trail[i]![0]!), sy(trail[i]![1]!))
    }
    ctx.stroke()
  }

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const vx = Number(snap.values.vx ?? 0)
  const vy = Number(snap.values.vy ?? 0)
  const Fx = Number(snap.values.Fx ?? 0)
  const Fy = Number(snap.values.Fy ?? 0)
  const speed = Number(snap.values.speed ?? 0)
  const Fmag = Number(snap.values.Fmag ?? 0)
  const px = sx(x)
  const py = sy(y)

  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(px, py, 8, 0, Math.PI * 2)
  ctx.fill()

  if (speed > 1e-6) {
    const vScale = 0.7 / Math.max(speed, 0.5)
    drawArrow(ctx, px, py, sx(x + vx * vScale), sy(y + vy * vScale), '#22d3ee', 2.2)
    drawDiagramLabel(ctx, 'v', sx(x + vx * vScale) + 4, sy(y + vy * vScale) - 4, {
      color: 'rgba(34, 211, 238, 0.95)',
    })
  }
  if (Fmag > 1e-6) {
    const fScale = 0.55 / Math.max(Fmag, 0.4)
    drawArrow(ctx, px, py, sx(x + Fx * fScale), sy(y + Fy * fScale), '#f472b6', 2.4)
    drawDiagramLabel(ctx, 'F', sx(x + Fx * fScale) + 4, sy(y + Fy * fScale) + 10, {
      color: 'rgba(244, 114, 182, 0.95)',
    })
  }

  drawMarker(ctx, ox, oy, { radius: 3, fill: 'rgba(148,163,184,0.8)', label: 'O' })
  drawDiagramLabel(
    ctx,
    Bout ? `B 出纸面 (·)  B=${B.toFixed(1)}` : `B 入纸面 (×)  B=${B.toFixed(1)}`,
    sx(world.xMin) + 8,
    sy(world.yMax) - 8,
    { color: 'rgba(226, 232, 240, 0.9)' },
  )
  drawDiagramLabel(
    ctx,
    `R=${R.toFixed(2)}  |v|=${speed.toFixed(2)}  |F|=${Fmag.toFixed(2)}`,
    sx(world.xMin) + 8,
    sy(world.yMax) - 28,
    { color: 'rgba(226, 232, 240, 0.85)' },
  )
}
