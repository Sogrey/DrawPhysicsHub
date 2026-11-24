import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function emWaveWorldBounds(): WorldBounds {
  return { xMin: -0.5, xMax: 12.5, yMin: -2.2, yMax: 2.2 }
}

export function drawEmWaveFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)

  const ePath = snap.trails?.path
  const bPath = snap.trails?.pathB
  if (ePath && ePath.length > 1) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    for (let i = 0; i < ePath.length; i++) {
      const p = ePath[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
  }
  if (bPath && bPath.length > 1) {
    // B drawn as vertical offset of same magnitude but dashed / pink — same y as E in 1D plot but we show as opposite visual: use -B*0.55 for separation
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.9)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    for (let i = 0; i < bPath.length; i++) {
      const p = bPath[i]!
      const y = -0.55 * (p[1] ?? 0)
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(y))
      else ctx.lineTo(sx(p[0]!), sy(y))
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  const zProbe = Number(snap.values.lambda ?? 4)
  const E = Number(snap.values.E ?? 0)
  const B = Number(snap.values.B ?? 0)
  drawArrow(ctx, sx(zProbe), sy(0), sx(zProbe), sy(E), 'rgba(56,189,248,0.95)', 2)
  drawArrow(ctx, sx(zProbe), sy(0), sx(zProbe), sy(-0.55 * B), 'rgba(244,114,182,0.95)', 2)
  drawArrow(ctx, sx(zProbe - 0.2), sy(0), sx(zProbe + 1.4), sy(0), 'rgba(251,191,36,0.95)', 2.5)
  drawDiagramLabel(ctx, 'S / ĉ', sx(zProbe + 1.5), sy(0.15), {
    color: '#fbbf24',
    font: '11px "Segoe UI", sans-serif',
  })

  const c = Number(snap.values.c ?? 0)
  const lambda = Number(snap.values.lambda ?? 0)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(520, W - 24), 48)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
  ctx.strokeRect(12, 10, Math.min(520, W - 24), 48)
  drawDiagramLabel(ctx, `电磁波 · λ=${lambda.toFixed(1)}  c=ω/k=${c.toFixed(2)}  E⊥B 同相`, 22, 28, {
    color: 'rgba(186, 230, 253, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '青实线=E(z)；粉虚线=B(z)（正交示意）；金=传播方向', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
