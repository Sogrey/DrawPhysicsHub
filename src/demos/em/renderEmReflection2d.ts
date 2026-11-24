import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function emReflectionWorldBounds(): WorldBounds {
  return { xMin: -4, xMax: 4, yMin: -2.5, yMax: 2.5 }
}

export function drawEmReflectionFrame(
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

  // interface
  ctx.fillStyle = 'rgba(51, 65, 85, 0.55)'
  ctx.fillRect(sx(0), sy(world.yMax), sx(world.xMax) - sx(0), sy(world.yMin) - sy(world.yMax))
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(world.yMin))
  ctx.lineTo(sx(0), sy(world.yMax))
  ctx.stroke()

  const Ei = Number(snap.values.Ei ?? 0)
  const Er = Number(snap.values.Er ?? 0)
  const Et = Number(snap.values.Et ?? 0)
  const R = Number(snap.values.R ?? 0)
  const T = Number(snap.values.T ?? 0)
  const n1 = Number(snap.values.n1 ?? 1)
  const n2 = Number(snap.values.n2 ?? 1.5)

  const amp = 1.6
  drawArrow(ctx, sx(-3.2), sy(0), sx(-0.3), sy(0), 'rgba(56,189,248,0.5)', 2)
  drawArrow(ctx, sx(-0.15), sy(0), sx(-0.15), sy(amp * Ei), 'rgba(56,189,248,0.95)', 2.5)
  drawArrow(ctx, sx(-0.45), sy(0), sx(-0.45), sy(amp * Er), 'rgba(244,114,182,0.95)', 2.5)
  drawArrow(ctx, sx(0.35), sy(0), sx(0.35), sy(amp * Et), 'rgba(74,222,128,0.95)', 2.5)
  drawArrow(ctx, sx(0.5), sy(0), sx(3.2), sy(0), 'rgba(74,222,128,0.45)', 2)

  drawDiagramLabel(ctx, `n₁=${n1.toFixed(2)}`, sx(-2.5), sy(2.1), {
    color: '#94a3b8',
    font: '12px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, `n₂=${n2.toFixed(2)}`, sx(1.2), sy(2.1), {
    color: '#94a3b8',
    font: '12px "Segoe UI", sans-serif',
  })

  // R/T bars
  const barX = 16
  const barY = H - 52
  const barW = Math.min(320, W - 40)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(barX, barY, barW, 40)
  ctx.fillStyle = 'rgba(244, 114, 182, 0.85)'
  ctx.fillRect(barX + 8, barY + 10, Math.max(2, (barW - 16) * R), 8)
  ctx.fillStyle = 'rgba(74, 222, 128, 0.85)'
  ctx.fillRect(barX + 8, barY + 24, Math.max(2, (barW - 16) * T), 8)
  drawDiagramLabel(ctx, `R=${R.toFixed(3)}  T=${T.toFixed(3)}`, barX + 8, barY + 8, {
    color: '#e2e8f0',
    font: '11px "Segoe UI", sans-serif',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 44)
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 44)
  drawDiagramLabel(ctx, `正入射反射 · r=${Number(snap.values.r ?? 0).toFixed(3)}`, 22, 28, {
    color: 'rgba(251, 207, 232, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '青=入射振幅，粉=反射，绿=透射；播放扫 n₂', 22, 44, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
