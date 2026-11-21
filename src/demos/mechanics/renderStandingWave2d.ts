import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDashedPath,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  drawTrailPolyline,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function standingWaveWorldBounds(ampMax: number, xMax: number): WorldBounds {
  const padY = Math.max(0.5, ampMax * 0.45)
  return {
    xMin: -0.5,
    xMax: xMax + 0.7,
    yMin: -ampMax - padY,
    yMax: ampMax + padY,
  }
}

export function drawStandingWaveFrame(
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

  const A = Number(snap.values.A ?? 0.6)
  const ampMax = Number(snap.values.ampMax ?? 2 * A)
  const lambda = Number(snap.values.lambda ?? 4)
  const xMax = Number(snap.values.xMax ?? 1.5 * lambda)
  const xNode = Number(snap.values.xNode ?? lambda / 4)

  // equilibrium
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sx(0), oy)
  ctx.lineTo(sx(xMax), oy)
  ctx.stroke()
  ctx.setLineDash([])

  // envelope from trails or compare
  const upper = snap.trails?.envelopeUpper
  const lower = snap.trails?.envelopeLower
  if (upper?.length) {
    drawDashedPath(ctx, upper, map, { strokeStyle: 'rgba(244, 114, 182, 0.55)' })
  }
  if (lower?.length) {
    drawDashedPath(ctx, lower, map, { strokeStyle: 'rgba(244, 114, 182, 0.55)' })
  }
  if (opts?.compare?.path?.length && !upper?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.7)',
      label: opts.compare.label,
    })
  }

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    drawTrailPolyline(ctx, path, map, { strokeStyle: '#38bdf8', lineWidth: 2.6 })
  }

  // node / antinode markers along axis
  const nodeXs = [xNode, xNode + lambda / 2].filter((x) => x <= xMax + 1e-6)
  const antiXs = [0, lambda / 2, lambda].filter((x) => x <= xMax + 1e-6)
  for (const x of nodeXs) {
    drawDiagramLabel(ctx, '节', sx(x) - 6, sy(0) + 16, { color: 'rgba(244, 114, 182, 0.9)' })
  }
  for (const x of antiXs) {
    drawDiagramLabel(ctx, '腹', sx(x) - 6, sy(ampMax) - 4, {
      color: 'rgba(251, 191, 36, 0.9)',
    })
  }

  // wavelength
  drawDimLine(ctx, sx(0), sy(ampMax + 0.25), sx(lambda), sy(ampMax + 0.25), `λ=${lambda.toFixed(2)} m`, {
    offset: 0,
  })

  // tracer: antinode at x=0, node at λ/4
  const beads = [
    {
      x: 0,
      y: Number(snap.values.yAnti ?? 0),
      color: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.45)',
      label: '波腹',
    },
    {
      x: xNode,
      y: Number(snap.values.yNode ?? 0),
      color: '#f472b6',
      glow: 'rgba(244, 114, 182, 0.45)',
      label: '波节',
    },
  ]
  for (const b of beads) {
    const px = sx(b.x)
    const py = sy(b.y)
    ctx.strokeStyle = b.glow
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(px, sy(-ampMax - 0.15))
    ctx.lineTo(px, sy(ampMax + 0.15))
    ctx.stroke()

    const g = ctx.createRadialGradient(px, py, 0, px, py, 12)
    g.addColorStop(0, b.glow)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(px, py, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = b.color
    ctx.beginPath()
    ctx.arc(px, py, 5.5, 0, Math.PI * 2)
    ctx.fill()
    drawDiagramLabel(ctx, b.label, px + 6, py - 10, { color: b.color })
  }

  drawMarker(ctx, ox, oy, { radius: 2.5, fill: 'rgba(148,163,184,0.8)', label: 'O' })
  drawDiagramLabel(ctx, `2A=${ampMax.toFixed(2)} m`, sx(0.15), sy(ampMax) - 18, {
    color: 'rgba(56, 189, 248, 0.95)',
  })
}
