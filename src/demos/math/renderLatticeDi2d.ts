import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function latticeDiWorldBounds(): WorldBounds {
  return { xMin: -0.5, xMax: 16, yMin: -3.4, yMax: 3 }
}

export function drawLatticeDiFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)

  const atoms = snap.trails?.path
  if (atoms) {
    for (let i = 0; i < atoms.length; i++) {
      const p = atoms[i]!
      const fill = i % 2 === 0 ? '#38bdf8' : '#f472b6'
      drawMarker(ctx, sx(p[0]!), sy(1.0 + (p[1] ?? 0)), { radius: i % 2 === 0 ? 5 : 7, fill, label: '' })
    }
  }

  const ac = snap.trails?.ac
  const op = snap.trails?.op
  const kMax = Number(snap.values.kMax ?? Math.PI)
  const k = Number(snap.values.k ?? 0)
  const wAc = Number(snap.values.wAc ?? 0)
  const wOp = Number(snap.values.wOp ?? 0)
  const x0 = 1
  const y0 = -2.6
  const xScale = 12 / kMax
  const yScale = 1.4 / 3

  const strokeBranch = (pts: number[][] | undefined, color: string) => {
    if (!pts || pts.length < 2) return
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!
      const X = x0 + p[0]! * xScale
      const Y = y0 + p[1]! * yScale
      if (i === 0) ctx.moveTo(sx(X), sy(Y))
      else ctx.lineTo(sx(X), sy(Y))
    }
    ctx.stroke()
  }
  strokeBranch(ac, 'rgba(56,189,248,0.9)')
  strokeBranch(op, 'rgba(244,114,182,0.9)')
  drawMarker(ctx, sx(x0 + k * xScale), sy(y0 + wAc * yScale), { radius: 4, fill: '#38bdf8', label: '' })
  drawMarker(ctx, sx(x0 + k * xScale), sy(y0 + wOp * yScale), { radius: 4, fill: '#f472b6', label: '' })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(500, W - 24), 48)
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)'
  ctx.strokeRect(12, 10, Math.min(500, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `双原子链 · ω_ac=${wAc.toFixed(2)}  ω_op=${wOp.toFixed(2)}  隙=${Number(snap.values.gap ?? 0).toFixed(2)}`,
    22,
    28,
    { color: 'rgba(251, 207, 232, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '青=声学支，粉=光学支（反相振动）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
