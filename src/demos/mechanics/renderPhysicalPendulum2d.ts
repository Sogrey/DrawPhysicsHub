import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function physicalPendulumWorldBounds(): WorldBounds {
  return { xMin: -2.5, xMax: 2.5, yMin: -2.8, yMax: 1.5 }
}

export function drawPhysicalPendulumFrame(
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
  const x1 = Number(snap.values.x1 ?? 0)
  const y1 = Number(snap.values.y1 ?? 0)
  const x2 = Number(snap.values.x2 ?? 0)
  const y2 = Number(snap.values.y2 ?? -2)
  ctx.strokeStyle = 'rgba(167,139,250,0.95)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(sx(x1), sy(y1))
  ctx.lineTo(sx(x2), sy(y2))
  ctx.stroke()
  drawMarker(ctx, sx(0), sy(0), { radius: 6, fill: '#fbbf24', label: '支点', labelDx: 8 })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
  ctx.strokeStyle = 'rgba(167,139,250,0.5)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `复摆 · T=${Number(snap.values.T ?? 0).toFixed(2)}s  L_eq=${Number(snap.values.Leq ?? 0).toFixed(2)}  θ=${Number(snap.values.theta ?? 0).toFixed(1)}°`,
    22,
    28,
    { color: 'rgba(196,181,253,0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '小角近似；调支点改变等效摆长', 22, 46, {
    color: 'rgba(226,232,240,0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
