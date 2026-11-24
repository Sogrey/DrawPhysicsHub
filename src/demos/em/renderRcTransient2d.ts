import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function rcWorldBounds(): WorldBounds {
  return { xMin: -4, xMax: 4, yMin: -2.5, yMax: 2.5 }
}

export function drawRcTransientFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)
  const Vc = Number(snap.values.Vc ?? 0)
  const V0 = Number(snap.values.V0 ?? 5)
  const I = Number(snap.values.I ?? 0)
  // battery + R + C schematic
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.strokeRect(sx(-2.5), sy(0.8), sx(-1.8) - sx(-2.5), sy(-0.8) - sy(0.8))
  drawDiagramLabel(ctx, 'V₀', sx(-2.6), sy(1.1), { color: '#94a3b8', font: '12px sans-serif' })
  ctx.beginPath()
  ctx.moveTo(sx(-1.8), sy(0))
  ctx.lineTo(sx(-0.4), sy(0))
  ctx.stroke()
  drawDiagramLabel(ctx, 'R', sx(-1.2), sy(0.35), { color: '#38bdf8', font: '12px sans-serif' })
  // capacitor plates
  ctx.fillStyle = '#fbbf24'
  const fillH = Math.max(0.1, (Vc / V0) * 1.4)
  ctx.fillRect(sx(0.5), sy(fillH / 2), 8, sy(-fillH / 2) - sy(fillH / 2))
  ctx.strokeStyle = '#e2e8f0'
  ctx.beginPath()
  ctx.moveTo(sx(0.3), sy(0.9))
  ctx.lineTo(sx(0.3), sy(-0.9))
  ctx.moveTo(sx(0.7), sy(0.9))
  ctx.lineTo(sx(0.7), sy(-0.9))
  ctx.stroke()
  drawDiagramLabel(ctx, `I=${I.toFixed(2)}`, sx(1.2), sy(0.2), { color: '#38bdf8', font: '12px sans-serif' })

  ctx.fillStyle = 'rgba(15,23,42,0.92)'
  ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
  ctx.strokeStyle = 'rgba(251,191,36,0.45)'
  ctx.strokeRect(12, 10, Math.min(460, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `RC 暂态 · Vc=${Vc.toFixed(2)}/${V0}  τ=${Number(snap.values.tau ?? 0).toFixed(2)}`,
    22,
    28,
    { color: 'rgba(253,230,138,0.98)', font: 'bold 13px sans-serif' },
  )
  drawDiagramLabel(ctx, '金条=电容充电量示意', 22, 46, {
    color: 'rgba(226,232,240,0.88)',
    font: '11px sans-serif',
  })
}
