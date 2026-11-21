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

export function waveTransverseWorldBounds(A: number, xMax: number): WorldBounds {
  const padY = Math.max(0.6, A * 0.55)
  return {
    xMin: -0.6,
    xMax: xMax + 0.8,
    yMin: -A - padY,
    yMax: A + padY,
  }
}

export function drawWaveTransverseFrame(
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

  const A = Number(snap.values.A ?? 1)
  const lambda = Number(snap.values.lambda ?? 4)
  const v = Number(snap.values.v ?? 0)
  const xProbe = Number(snap.values.xProbe ?? lambda)

  // equilibrium line
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sx(0), oy)
  ctx.lineTo(sx(Number(snap.values.xMax ?? 12)), oy)
  ctx.stroke()
  ctx.setLineDash([])

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.75)',
      label: opts.compare.label,
    })
  }

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    drawTrailPolyline(ctx, path, map, { strokeStyle: '#38bdf8', lineWidth: 2.6 })
  }

  // wavelength bracket near top
  const yBracket = A + Math.max(0.35, A * 0.25)
  drawDimLine(ctx, sx(0), sy(yBracket), sx(lambda), sy(yBracket), `λ=${lambda.toFixed(2)} m`, {
    offset: 0,
  })

  // tracer particles at x=0 and x=λ
  const beads = [
    { x: 0, y: Number(snap.values.y0 ?? 0), label: 'x=0' },
    { x: xProbe, y: Number(snap.values.yProbe ?? 0), label: 'x=λ' },
  ]
  for (const b of beads) {
    const px = sx(b.x)
    const py = sy(b.y)
    // vertical guide
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(px, sy(-A - 0.2))
    ctx.lineTo(px, sy(A + 0.2))
    ctx.stroke()

    const glow = ctx.createRadialGradient(px, py, 0, px, py, 12)
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.45)')
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(px, py, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(px, py, 5.5, 0, Math.PI * 2)
    ctx.fill()
    drawDiagramLabel(ctx, b.label, px + 6, py - 10, { color: 'rgba(251, 191, 36, 0.95)' })
  }

  // phase-velocity arrow near crest-ish
  const tipX = Math.min(Number(snap.values.xMax ?? 12) - 0.5, 3.2 + v * 0.15)
  drawArrow(ctx, sx(1.2), sy(-A - 0.35), sx(tipX), sy(-A - 0.35), '#4ade80', 2.2)
  drawDiagramLabel(ctx, `v=${v.toFixed(2)} m/s →`, sx(1.2), sy(-A - 0.55), {
    color: 'rgba(74, 222, 128, 0.95)',
  })

  drawMarker(ctx, ox, oy, { radius: 2.5, fill: 'rgba(148,163,184,0.8)', label: 'O' })
  drawDiagramLabel(ctx, `A=${A.toFixed(2)} m`, sx(0.2), sy(A) - 6, {
    color: 'rgba(56, 189, 248, 0.95)',
  })
}
