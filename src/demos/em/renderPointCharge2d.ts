import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import { traceChargeFieldLines } from '@/core/physics/fieldLines'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import { drawArrowedFieldLines } from '@/core/render/fieldLines2d'
import {
  drawArrow,
  drawDashedPath,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function pointChargeWorldBounds(world: number): WorldBounds {
  return {
    xMin: -world,
    xMax: world,
    yMin: -world * 0.75,
    yMax: world * 0.75,
  }
}

function chargeColor(Q: number) {
  if (Q > 0.05) return '#f87171'
  if (Q < -0.05) return '#38bdf8'
  return '#94a3b8'
}

export function drawPointChargeFrame(
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

  const Q1 = Number(snap.values.Q1 ?? 0)
  const Q2 = Number(snap.values.Q2 ?? 0)
  const d = Number(snap.values.d ?? 2)
  const q1x = Number(snap.values.q1x ?? -d / 2)
  const q2x = Number(snap.values.q2x ?? d / 2)
  const K = Number(snap.values.K ?? 1)

  const charges = [
    { x: q1x, y: 0, Q: Q1 },
    { x: q2x, y: 0, Q: Q2 },
  ]
  const lines = traceChargeFieldLines(charges, world, {
    k: K,
    linesPerCharge: 14,
    seedR: 0.3,
    step: 0.05,
    sinkR: 0.26,
  })
  drawArrowedFieldLines(ctx, lines, map, {
    strokeStyle: 'rgba(186, 170, 255, 0.82)',
    lineWidth: 1.4,
    arrowEvery: 0.9,
    arrowLen: 0.26,
  })

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.7)',
      label: opts.compare.label,
    })
  }

  const labeled = [
    { x: q1x, y: 0, Q: Q1, label: 'Q₁' },
    { x: q2x, y: 0, Q: Q2, label: 'Q₂' },
  ]
  for (const c of labeled) {
    const px = sx(c.x)
    const py = sy(c.y)
    const col = chargeColor(c.Q)
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 18)
    glow.addColorStop(0, col + '99')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(px, py, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(px, py, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0b1220'
    ctx.font = 'bold 12px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(c.Q >= 0 ? '+' : '−', px, py + 0.5)
    drawDiagramLabel(ctx, `${c.label}=${c.Q.toFixed(1)}`, px - 18, py - 22, { color: col })
  }

  drawDimLine(ctx, sx(q1x), sy(0), sx(q2x), sy(0), `d=${d.toFixed(2)} m`, { offset: 22 })

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const Ex = Number(snap.values.Ex ?? 0)
  const Ey = Number(snap.values.Ey ?? 0)
  const Emag = Number(snap.values.Emag ?? 0)
  const ppx = sx(x)
  const ppy = sy(y)
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(ppx, ppy, 6, 0, Math.PI * 2)
  ctx.fill()

  if (Emag > 1e-6) {
    const eScale = 0.55 / Math.max(Emag, 0.5)
    drawArrow(ctx, ppx, ppy, sx(x + Ex * eScale), sy(y + Ey * eScale), '#f472b6', 2.4)
    drawDiagramLabel(ctx, 'E', sx(x + Ex * eScale) + 4, sy(y + Ey * eScale) - 4, {
      color: 'rgba(244, 114, 182, 0.95)',
    })
  }

  drawMarker(ctx, ox, oy, { radius: 3, fill: 'rgba(148,163,184,0.9)', label: 'O' })
  drawDiagramLabel(
    ctx,
    `|E|=${Emag.toFixed(2)}  |E|(O)=${Number(snap.values.Emag0 ?? 0).toFixed(2)}`,
    sx(world.xMin) + 8,
    sy(world.yMax) - 8,
    { color: 'rgba(226, 232, 240, 0.9)' },
  )
}
