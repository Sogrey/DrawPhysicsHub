import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function latticeMonoWorldBounds(): WorldBounds {
  return { xMin: -0.5, xMax: 16.5, yMin: -3.2, yMax: 3.2 }
}

export function drawLatticeMonoFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)

  const atoms = snap.trails?.path
  if (atoms) {
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < atoms.length; i++) {
      const p = atoms[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(1.2))
      else ctx.lineTo(sx(p[0]!), sy(1.2))
    }
    ctx.stroke()
    for (const p of atoms) {
      drawMarker(ctx, sx(p[0]!), sy(1.2), { radius: 6, fill: '#38bdf8', label: '' })
    }
  }

  // dispersion inset bottom
  const disp = snap.trails?.disp
  const k = Number(snap.values.k ?? 0)
  const omega = Number(snap.values.omega ?? 0)
  const kMax = Number(snap.values.kMax ?? Math.PI)
  if (disp && disp.length > 1) {
    const x0 = 1
    const y0 = -2.4
    const xScale = 12 / kMax
    const yScale = 1.6 / Math.max(0.1, 2 * Math.sqrt(Number(snap.values.kappa ?? 1)))
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < disp.length; i++) {
      const p = disp[i]!
      const X = x0 + p[0]! * xScale
      const Y = y0 + p[1]! * yScale
      if (i === 0) ctx.moveTo(sx(X), sy(Y))
      else ctx.lineTo(sx(X), sy(Y))
    }
    ctx.stroke()
    drawMarker(ctx, sx(x0 + k * xScale), sy(y0 + omega * yScale), {
      radius: 5,
      fill: '#fbbf24',
      label: '',
    })
    drawDiagramLabel(ctx, 'ω(k)', sx(x0), sy(y0 + 1.9), {
      color: '#fbbf24',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `单原子链 · k=${k.toFixed(2)}  ω=${omega.toFixed(2)}  (π/a=${kMax.toFixed(2)})`,
    22,
    28,
    { color: 'rgba(253, 230, 138, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '上：位移波；下：色散曲线（扫第一布里渊区）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
