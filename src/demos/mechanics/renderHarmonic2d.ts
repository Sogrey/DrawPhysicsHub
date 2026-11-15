import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  drawTrailPolyline,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import type { CompareTrail } from '@/core/physics/adapter'

export function harmonicWorldBounds(A: number): WorldBounds {
  const pad = Math.max(0.5, A * 0.25)
  return {
    xMin: -A - pad,
    xMax: A + pad,
    yMin: -pad * 0.6,
    yMax: pad * 1.2,
  }
}

export function drawHarmonicFrame(
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

  // equilibrium spring line
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), oy)
  ctx.lineTo(sx(world.xMax), oy)
  ctx.stroke()
  ctx.setLineDash([])

  const compare = opts?.compare
  if (compare?.path?.length) {
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.85)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 2
    ctx.beginPath()
    const p0 = compare.path[0]!
    ctx.moveTo(sx(p0[0]!), sy(0))
    for (let i = 1; i < compare.path.length; i++) {
      ctx.lineTo(sx(compare.path[i]![0]!), sy(0))
    }
    ctx.stroke()
    ctx.setLineDash([])
    if (compare.label) {
      const last = compare.path[compare.path.length - 1]!
      ctx.fillStyle = 'rgba(244, 114, 182, 0.95)'
      ctx.font = '11px "Segoe UI", sans-serif'
      ctx.fillText(compare.label, sx(last[0]!) + 6, oy - 8)
    }
  }

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    drawTrailPolyline(ctx, path, map, { strokeStyle: '#38bdf8', lineWidth: 2 })
  }

  const x = Number(snap.values.x ?? 0)
  const px = sx(x)
  const py = sy(0)

  // spring zigzag from left wall to mass
  const wallX = sx(world.xMin + 0.15)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(wallX, py)
  const segs = 10
  for (let i = 1; i <= segs; i++) {
    const t = i / segs
    const xi = wallX + (px - wallX) * t
    const yi = py + (i % 2 === 0 ? -8 : 8) * (i === segs ? 0 : 1)
    ctx.lineTo(xi, yi)
  }
  ctx.lineTo(px, py)
  ctx.stroke()

  drawMarker(ctx, ox, oy, { radius: 2.5, fill: 'rgba(148, 163, 184, 0.8)', label: 'O' })

  const glow = ctx.createRadialGradient(px, py, 0, px, py, 14)
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.4)')
  glow.addColorStop(1, 'rgba(56, 189, 248, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(px, py, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(px, py, 7, 0, Math.PI * 2)
  ctx.fill()

  const vx = Number(snap.values.vx ?? 0)
  const tipX = sx(x + vx * 0.12)
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(tipX, py)
  ctx.stroke()

  const A = Number(snap.values.A ?? snap.values.A0 ?? world.xMax * 0.7)
  const omega = Number(snap.values.omega ?? snap.values.omega0 ?? 0)
  const gamma = snap.values.gamma
  drawDimLine(ctx, sx(-A), oy - 10, sx(A), oy - 10, `A=${Number(A).toFixed(2)} m`, {
    offset: -6,
  })
  drawDiagramLabel(ctx, `x=${x.toFixed(2)} m`, px + 10, py - 18)
  if (omega) {
    drawDiagramLabel(ctx, `ω=${Number(omega).toFixed(2)} rad/s`, sx(world.xMin) + 8, sy(world.yMax) + 16, {
      color: 'rgba(96, 165, 250, 0.95)',
    })
  }
  if (gamma != null) {
    drawDiagramLabel(ctx, `γ=${Number(gamma).toFixed(2)} /s`, sx(world.xMin) + 8, sy(world.yMax) + 32, {
      color: 'rgba(167, 139, 250, 0.95)',
    })
  }
}
