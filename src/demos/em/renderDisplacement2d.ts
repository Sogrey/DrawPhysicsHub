import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function displacementWorldBounds(): WorldBounds {
  return { xMin: -4, xMax: 4, yMin: -2.8, yMax: 2.8 }
}

export function drawDisplacementFrame(
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

  const E = Number(snap.values.E ?? 0)
  const Id = Number(snap.values.Id ?? 0)
  const gap = Number(snap.values.gap ?? 0.8)
  const V0 = Number(snap.values.V0 ?? 2)

  // plates
  ctx.fillStyle = 'rgba(148, 163, 184, 0.95)'
  ctx.fillRect(sx(-1.6), sy(gap / 2) - 4, sx(1.6) - sx(-1.6), 8)
  ctx.fillRect(sx(-1.6), sy(-gap / 2) - 4, sx(1.6) - sx(-1.6), 8)

  // E field lines
  const nE = Math.max(1, Math.min(7, Math.round(E * 3)))
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < nE; i++) {
    const x = -1.2 + (2.4 * i) / Math.max(1, nE - 1)
    ctx.beginPath()
    ctx.moveTo(sx(x), sy(gap / 2 - 0.1))
    ctx.lineTo(sx(x), sy(-gap / 2 + 0.1))
    ctx.stroke()
  }

  // displacement current arrow (downward while charging if top +)
  const idLen = Math.min(1.4, 0.3 + Id * 1.2)
  drawArrow(ctx, sx(0), sy(gap / 2 - 0.15), sx(0), sy(gap / 2 - 0.15 - idLen), 'rgba(167,139,250,0.95)', 2.5)
  drawDiagramLabel(ctx, 'I_d', sx(0.15), sy(0), {
    color: '#a78bfa',
    font: '12px "Segoe UI", sans-serif',
  })

  // wires
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.85)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(sx(-1.6), sy(gap / 2))
  ctx.lineTo(sx(-3.2), sy(gap / 2))
  ctx.lineTo(sx(-3.2), sy(-gap / 2))
  ctx.lineTo(sx(-1.6), sy(-gap / 2))
  ctx.stroke()
  drawArrow(ctx, sx(-3.2), sy(0.4), sx(-3.2), sy(-0.4), 'rgba(74,222,128,0.95)', 2)
  drawDiagramLabel(ctx, 'I_导线', sx(-3.9), sy(0.15), {
    color: '#4ade80',
    font: '11px "Segoe UI", sans-serif',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(520, W - 24), 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(12, 10, Math.min(520, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `位移电流 · E=${E.toFixed(2)}/${V0.toFixed(1)}  I_d=${Id.toFixed(3)} = I_导线`,
    22,
    28,
    { color: 'rgba(196, 181, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '金=E；紫=极板间 I_d；绿=导线电流（连续）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
