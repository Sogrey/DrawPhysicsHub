import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function rlcWorldBounds(): WorldBounds {
  return { xMin: -0.2, xMax: 4.2, yMin: -0.3, yMax: 3.2 }
}

export function drawRlcFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)
  const path = snap.trails?.path
  const w0 = Number(snap.values.w0 ?? 1)
  const omega = Number(snap.values.omega ?? 1)
  const I = Number(snap.values.I ?? 0)
  if (path && path.length > 1) {
    const xmax = path[path.length - 1]![0]!
    const ymax = Math.max(...path.map((p) => p[1]!), 0.1)
    ctx.strokeStyle = 'rgba(251,191,36,0.9)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      const X = (p[0]! / xmax) * 4
      const Y = (p[1]! / ymax) * 2.6
      if (i === 0) ctx.moveTo(sx(X), sy(Y))
      else ctx.lineTo(sx(X), sy(Y))
    }
    ctx.stroke()
    drawMarker(ctx, sx((omega / xmax) * 4), sy((I / ymax) * 2.6), { radius: 5, fill: '#a78bfa', label: '' })
  }
  ctx.fillStyle = 'rgba(15,23,42,0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
  ctx.strokeStyle = 'rgba(251,191,36,0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `RLC · ω=${omega.toFixed(2)}  ω₀=${w0.toFixed(2)}  I=${I.toFixed(2)}  Q=${Number(snap.values.Q ?? 0).toFixed(1)}`,
    22,
    28,
    { color: 'rgba(253,230,138,0.98)', font: 'bold 13px sans-serif' },
  )
  drawDiagramLabel(ctx, '扫频看谐振峰；R↓ → Q↑ 峰更尖', 22, 46, {
    color: 'rgba(226,232,240,0.88)',
    font: '11px sans-serif',
  })
}
