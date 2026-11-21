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

export function rotationAxisWorldBounds(R: number): WorldBounds {
  const pad = Math.max(0.8, R * 0.45)
  return {
    xMin: -R - pad,
    xMax: R + pad,
    yMin: -R - pad,
    yMax: R + pad,
  }
}

export function drawRotationAxisFrame(
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

  const R = Number(snap.values.R ?? 1.5)
  const theta = Number(snap.values.thetaRad ?? 0)
  const omega = Number(snap.values.omega ?? 0)
  const alpha = Number(snap.values.alpha ?? 0)

  // disk body
  ctx.beginPath()
  ctx.fillStyle = 'rgba(56, 189, 248, 0.12)'
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
  ctx.lineWidth = 2
  const steps = 64
  for (let i = 0; i <= steps; i++) {
    const th = (2 * Math.PI * i) / steps
    const px = sx(R * Math.cos(th))
    const py = sy(R * Math.sin(th))
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // spokes for rigid-body feel
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.lineWidth = 1.25
  for (let k = 0; k < 4; k++) {
    const th = theta + (k * Math.PI) / 2
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(sx(R * Math.cos(th)), sy(R * Math.sin(th)))
    ctx.stroke()
  }

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.7)',
      label: opts.compare.label,
    })
  }

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    drawTrailPolyline(ctx, path, map, { strokeStyle: '#38bdf8', lineWidth: 2 })
  }

  const rimX = Number(snap.values.rimX ?? R)
  const rimY = Number(snap.values.rimY ?? 0)
  const vx = Number(snap.values.vx ?? 0)
  const vy = Number(snap.values.vy ?? 0)
  const px = sx(rimX)
  const py = sy(rimY)

  // radius to mark
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.7)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(px, py)
  ctx.stroke()

  const vScale = 0.35
  drawArrow(ctx, px, py, sx(rimX + vx * vScale), sy(rimY + vy * vScale), '#4ade80', 2.4)
  ctx.fillStyle = 'rgba(74, 222, 128, 0.95)'
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillText('v', sx(rimX + vx * vScale) + 4, sy(rimY + vy * vScale) - 4)

  // rim marker
  const glow = ctx.createRadialGradient(px, py, 0, px, py, 12)
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.5)')
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(px, py, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#22d3ee'
  ctx.beginPath()
  ctx.arc(px, py, 6, 0, Math.PI * 2)
  ctx.fill()

  drawMarker(ctx, ox, oy, { radius: 4, fill: 'rgba(167,139,250,0.95)', label: 'O' })

  drawDimLine(ctx, ox, oy, sx(R), oy, `R=${R.toFixed(2)} m`, { offset: 18 })
  drawDiagramLabel(ctx, `ω=${omega.toFixed(2)} rad/s`, sx(-R) + 6, sy(R) - 8, {
    color: 'rgba(56, 189, 248, 0.95)',
  })
  drawDiagramLabel(ctx, `α=${alpha.toFixed(2)} rad/s²`, sx(-R) + 6, sy(R) - 24, {
    color: 'rgba(251, 191, 36, 0.95)',
  })
}
