import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function coupledOscWorldBounds(): WorldBounds {
  return { xMin: -4, xMax: 4, yMin: -2.2, yMax: 2.2 }
}

export function drawCoupledOscFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)
  const x1 = Number(snap.values.x1 ?? 0) - 1.2
  const x2 = Number(snap.values.x2 ?? 0) + 1.2
  // walls + springs
  ctx.strokeStyle = 'rgba(148,163,184,0.8)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(sx(-3.2), sy(-0.8))
  ctx.lineTo(sx(-3.2), sy(0.8))
  ctx.moveTo(sx(3.2), sy(-0.8))
  ctx.lineTo(sx(3.2), sy(0.8))
  ctx.stroke()
  ctx.strokeStyle = 'rgba(100,116,139,0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx(-3.2), sy(0))
  ctx.lineTo(sx(x1), sy(0))
  ctx.lineTo(sx(x2), sy(0))
  ctx.lineTo(sx(3.2), sy(0))
  ctx.stroke()
  drawMarker(ctx, sx(x1), sy(0), { radius: 10, fill: '#38bdf8', label: '1', labelDy: -14 })
  drawMarker(ctx, sx(x2), sy(0), { radius: 10, fill: '#f472b6', label: '2', labelDy: -14 })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(500, W - 24), 48)
  ctx.strokeStyle = 'rgba(167,139,250,0.5)'
  ctx.strokeRect(12, 10, Math.min(500, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `耦合振子 · mode=${Number(snap.values.mode ?? 1)}  ω_s=${Number(snap.values.wSym ?? 0).toFixed(2)}  ω_a=${Number(snap.values.wAsym ?? 0).toFixed(2)}`,
    22,
    28,
    { color: 'rgba(196,181,253,0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '1=对称 2=反对称 3=混合（拍）', 22, 46, {
    color: 'rgba(226,232,240,0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
