import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function latticeGrapheneWorldBounds(): WorldBounds {
  return { xMin: -4.5, xMax: 4.5, yMin: -3.5, yMax: 3.5 }
}

export function drawLatticeGrapheneFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const atoms = snap.trails?.path
  if (atoms) {
    for (const p of atoms) {
      const fill = (p[2] ?? 0) < 0.5 ? '#38bdf8' : '#f472b6'
      drawMarker(ctx, sx(p[0]!), sy(p[1]!), { radius: 4.5, fill, label: '' })
    }
  }

  // Dirac cone inset on the right
  const cone = snap.trails?.cone
  const q = Number(snap.values.q ?? 0)
  const Ep = Number(snap.values.Ep ?? 0)
  const Em = Number(snap.values.Em ?? 0)
  if (cone && cone.length > 2) {
    const ox = 2.2
    const oy = -0.2
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    for (let i = 0; i < cone.length; i += 2) {
      const p = cone[i]!
      const X = ox + p[0]! * 0.7
      const Y = oy + p[1]! * 0.7
      if (i === 0) ctx.moveTo(sx(X), sy(Y))
      else ctx.lineTo(sx(X), sy(Y))
    }
    ctx.stroke()
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.85)'
    ctx.beginPath()
    for (let i = 1; i < cone.length; i += 2) {
      const p = cone[i]!
      const X = ox + p[0]! * 0.7
      const Y = oy + p[1]! * 0.7
      if (i === 1) ctx.moveTo(sx(X), sy(Y))
      else ctx.lineTo(sx(X), sy(Y))
    }
    ctx.stroke()
    drawMarker(ctx, sx(ox + q * 0.7), sy(oy + Ep * 0.7), { radius: 4, fill: '#fbbf24', label: '' })
    drawMarker(ctx, sx(ox + q * 0.7), sy(oy + Em * 0.7), { radius: 4, fill: '#a78bfa', label: '' })
    drawDiagramLabel(ctx, 'Dirac', sx(ox - 0.2), sy(oy + 2.0), {
      color: '#fbbf24',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(500, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'
  ctx.strokeRect(12, 10, Math.min(500, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `石墨烯示意 · q=${q.toFixed(2)}  E±=±${Ep.toFixed(2)}  v_F=${Number(snap.values.vf ?? 0).toFixed(2)}`,
    22,
    28,
    { color: 'rgba(253, 230, 138, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '青/粉=A/B 子晶格；右=Dirac 锥截面', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
