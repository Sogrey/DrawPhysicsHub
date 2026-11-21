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

export function dipoleWorldBounds(world: number): WorldBounds {
  return {
    xMin: -world,
    xMax: world,
    yMin: -world * 0.75,
    yMax: world * 0.75,
  }
}

export function drawDipoleFrame(
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

  const a = Number(snap.values.a ?? 1.2)
  const p = Number(snap.values.p ?? 2.4)
  const Q = Number(snap.values.Q ?? 0)
  const qMinusX = Number(snap.values.qMinusX ?? -a / 2)
  const qPlusX = Number(snap.values.qPlusX ?? a / 2)
  const K = Number(snap.values.K ?? 1)

  const charges = [
    { x: qMinusX, y: 0, Q: -Q },
    { x: qPlusX, y: 0, Q: +Q },
  ]
  const lines = traceChargeFieldLines(charges, world, {
    k: K,
    linesPerCharge: 16,
    seedR: 0.28,
    step: 0.048,
    sinkR: 0.24,
  })
  drawArrowedFieldLines(ctx, lines, map, {
    strokeStyle: 'rgba(186, 170, 255, 0.85)',
    lineWidth: 1.4,
    arrowEvery: 0.85,
    arrowLen: 0.25,
  })

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.65)',
      label: opts.compare.label,
    })
  }

  const pHalf = Math.min(1.1, Math.max(0.55, a * 0.55 + 0.35))
  drawArrow(ctx, sx(-pHalf * 0.15), sy(0), sx(pHalf), sy(0), 'rgba(251, 191, 36, 0.95)', 2.2)
  drawDiagramLabel(ctx, `p=${p.toFixed(1)}`, sx(pHalf) + 6, sy(0) - 14, {
    color: 'rgba(251, 191, 36, 0.95)',
  })

  const labeled = [
    { x: qMinusX, label: '−', color: '#38bdf8', name: '−Q' },
    { x: qPlusX, label: '+', color: '#f87171', name: '+Q' },
  ]
  for (const c of labeled) {
    const px = sx(c.x)
    const py = sy(0)
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 16)
    glow.addColorStop(0, c.color + '99')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(px, py, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c.color
    ctx.beginPath()
    ctx.arc(px, py, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0b1220'
    ctx.font = 'bold 12px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(c.label, px, py + 0.5)
    drawDiagramLabel(ctx, `${c.name}`, px - 14, py - 20, { color: c.color })
  }

  drawDimLine(ctx, sx(qMinusX), sy(0), sx(qPlusX), sy(0), `a=${a.toFixed(2)}  |Q|=${Q.toFixed(2)}`, {
    offset: -26,
  })

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const Ex = Number(snap.values.Ex ?? 0)
  const Ey = Number(snap.values.Ey ?? 0)
  const Emag = Number(snap.values.Emag ?? 0)
  const ExI = Number(snap.values.ExI ?? 0)
  const EyI = Number(snap.values.EyI ?? 0)
  const EmagI = Number(snap.values.EmagI ?? 0)
  const ratio = Number(snap.values.ratio ?? 0)
  const ppx = sx(x)
  const ppy = sy(y)

  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(ppx, ppy, 6, 0, Math.PI * 2)
  ctx.fill()

  const eScale = 0.5 / Math.max(Math.max(Emag, EmagI), 0.4)
  if (Emag > 1e-6) {
    drawArrow(ctx, ppx, ppy, sx(x + Ex * eScale), sy(y + Ey * eScale), '#f472b6', 2.4)
  }
  if (EmagI > 1e-6) {
    drawArrow(ctx, ppx, ppy, sx(x + ExI * eScale), sy(y + EyI * eScale), '#34d399', 1.6)
    drawDiagramLabel(ctx, 'Eᵢ', sx(x + ExI * eScale) + 4, sy(y + EyI * eScale) - 6, {
      color: 'rgba(52, 211, 153, 0.95)',
    })
  }
  if (Emag > 1e-6) {
    drawDiagramLabel(ctx, 'E', sx(x + Ex * eScale) + 4, sy(y + Ey * eScale) + 10, {
      color: 'rgba(244, 114, 182, 0.95)',
    })
  }

  drawMarker(ctx, ox, oy, { radius: 3, fill: 'rgba(148,163,184,0.9)', label: 'O' })
  drawDiagramLabel(
    ctx,
    `|E|=${Emag.toFixed(2)}  |E|ᵢ=${EmagI.toFixed(2)}  ratio=${ratio.toFixed(3)}`,
    sx(world.xMin) + 8,
    sy(world.yMax) - 8,
    { color: 'rgba(226, 232, 240, 0.9)' },
  )
}
