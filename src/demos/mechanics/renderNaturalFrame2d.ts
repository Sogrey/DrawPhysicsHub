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

export function naturalFrameWorldBounds(A: number, B: number): WorldBounds {
  const rx = Math.max(A, B)
  const pad = Math.max(0.9, rx * 0.4)
  return {
    xMin: -A - pad,
    xMax: A + pad,
    yMin: -B - pad,
    yMax: B + pad,
  }
}

export function drawNaturalFrameFrame(
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

  const A = Number(snap.values.A ?? 3)
  const B = Number(snap.values.B ?? 1.8)

  // guide ellipse
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.setLineDash([5, 5])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  const steps = 96
  for (let i = 0; i <= steps; i++) {
    const th = (2 * Math.PI * i) / steps
    const px = sx(A * Math.cos(th))
    const py = sy(B * Math.sin(th))
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
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
    drawTrailPolyline(ctx, path, map, { strokeStyle: '#38bdf8', lineWidth: 2.5 })
  }

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const vx = Number(snap.values.vx ?? 0)
  const vy = Number(snap.values.vy ?? 0)
  const etx = Number(snap.values.etx ?? 0)
  const ety = Number(snap.values.ety ?? 0)
  const enx = Number(snap.values.enx ?? 0)
  const eny = Number(snap.values.eny ?? 0)
  const at = Number(snap.values.at ?? 0)
  const an = Number(snap.values.an ?? 0)
  const speed = Number(snap.values.speed ?? 0)
  const rho = Number(snap.values.rho ?? 0)
  const px = sx(x)
  const py = sy(y)

  // unit frame ticks (ê_t, ê_n)
  const uLen = Math.max(A, B) * 0.28
  drawArrow(ctx, px, py, sx(x + etx * uLen), sy(y + ety * uLen), 'rgba(34, 211, 238, 0.55)', 1.6)
  drawArrow(ctx, px, py, sx(x + enx * uLen), sy(y + eny * uLen), 'rgba(244, 114, 182, 0.45)', 1.6)
  ctx.fillStyle = 'rgba(34, 211, 238, 0.9)'
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillText('êₜ', sx(x + etx * uLen) + 3, sy(y + ety * uLen) - 3)
  ctx.fillStyle = 'rgba(244, 114, 182, 0.9)'
  ctx.fillText('êₙ', sx(x + enx * uLen) + 3, sy(y + eny * uLen) - 3)

  // velocity
  const vScale = 0.32
  drawArrow(ctx, px, py, sx(x + vx * vScale), sy(y + vy * vScale), '#22d3ee', 2.4)
  ctx.fillStyle = 'rgba(34, 211, 238, 0.95)'
  ctx.fillText('v', sx(x + vx * vScale) + 4, sy(y + vy * vScale) - 4)

  // a_t along ê_t, a_n along ê_n (signed a_t)
  const aScale = 0.22
  const atx = etx * at
  const aty = ety * at
  const anx = enx * Math.max(0, an)
  const any = eny * Math.max(0, an)
  drawArrow(ctx, px, py, sx(x + atx * aScale), sy(y + aty * aScale), '#4ade80', 2.3)
  drawArrow(ctx, px, py, sx(x + anx * aScale), sy(y + any * aScale), '#f472b6', 2.3)
  ctx.fillStyle = 'rgba(74, 222, 128, 0.95)'
  ctx.fillText('aₜ', sx(x + atx * aScale) + 4, sy(y + aty * aScale) - 4)
  ctx.fillStyle = 'rgba(244, 114, 182, 0.95)'
  ctx.fillText('aₙ', sx(x + anx * aScale) + 4, sy(y + any * aScale) - 4)

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

  drawDimLine(ctx, ox, oy, sx(A), oy, `A=${A.toFixed(2)} m`, { offset: 20 })
  drawDimLine(ctx, ox, oy, ox, sy(B), `B=${B.toFixed(2)} m`, { offset: -16 })

  const labelX = sx(-A) + 6
  const labelY = sy(B) - 8
  drawDiagramLabel(ctx, `|v|=${speed.toFixed(2)} m/s`, labelX, labelY, {
    color: 'rgba(34, 211, 238, 0.95)',
  })
  drawDiagramLabel(ctx, `aₜ=${at.toFixed(2)}  aₙ=${an.toFixed(2)}`, labelX, labelY - 16, {
    color: 'rgba(148, 163, 184, 0.95)',
  })
  if (rho > 0) {
    drawDiagramLabel(ctx, `ρ=${rho.toFixed(2)} m`, labelX, labelY - 32, {
      color: 'rgba(251, 191, 36, 0.95)',
    })
  }
}
