import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDashedPath,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  drawTrailPolyline,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function circularWorldBounds(R: number): WorldBounds {
  const pad = Math.max(0.8, R * 0.35)
  return {
    xMin: -R - pad,
    xMax: R + pad,
    yMin: -R - pad,
    yMax: R + pad,
  }
}

export function drawCircularFrame(
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

  const R = Number(snap.values.R ?? 1)
  // guide circle
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.setLineDash([5, 5])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  const steps = 64
  for (let i = 0; i <= steps; i++) {
    const th = (2 * Math.PI * i) / steps
    const px = sx(R * Math.cos(th))
    const py = sy(R * Math.sin(th))
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.setLineDash([])

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.85)',
      label: opts.compare.label,
    })
  }

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    drawTrailPolyline(ctx, path, map, { strokeStyle: '#38bdf8', lineWidth: 2.5 })
  }

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const vx = Number(snap.values.vx ?? 0)
  const vy = Number(snap.values.vy ?? 0)
  const ax = Number(snap.values.ax ?? 0)
  const ay = Number(snap.values.ay ?? 0)
  const px = sx(x)
  const py = sy(y)

  // radius
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.lineWidth = 1.25
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(px, py)
  ctx.stroke()

  const vScale = 0.35
  const aScale = 0.25
  drawArrow(ctx, px, py, sx(x + vx * vScale), sy(y + vy * vScale), '#4ade80', 2.4)
  drawArrow(ctx, px, py, sx(x + ax * aScale), sy(y + ay * aScale), '#f472b6', 2.2)

  ctx.fillStyle = 'rgba(74, 222, 128, 0.95)'
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillText('v', sx(x + vx * vScale) + 4, sy(y + vy * vScale) - 4)
  ctx.fillStyle = 'rgba(244, 114, 182, 0.95)'
  ctx.fillText('aₙ', sx(x + ax * aScale) + 4, sy(y + ay * aScale) - 4)

  const glow = ctx.createRadialGradient(px, py, 0, px, py, 14)
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.45)')
  glow.addColorStop(1, 'rgba(56, 189, 248, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(px, py, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(px, py, 6.5, 0, Math.PI * 2)
  ctx.fill()

  drawMarker(ctx, ox, oy, { radius: 3, fill: 'rgba(148,163,184,0.9)', label: 'O' })

  const omega = Number(snap.values.omega ?? 0)
  const speed = Number(snap.values.speed ?? 0)
  drawDimLine(ctx, ox, oy, sx(R), oy, `R=${R.toFixed(2)} m`, { offset: 18 })
  drawDiagramLabel(ctx, `ω=${omega.toFixed(2)} rad/s`, sx(-R) + 6, sy(R) - 8, {
    color: 'rgba(96, 165, 250, 0.95)',
  })
  drawDiagramLabel(ctx, `|v|=${speed.toFixed(2)} m/s`, sx(-R) + 6, sy(R) - 24, {
    color: 'rgba(74, 222, 128, 0.95)',
  })
}
