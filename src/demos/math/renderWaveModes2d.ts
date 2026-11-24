import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function waveModesWorldBounds(L: number): WorldBounds {
  return { xMin: -0.3, xMax: L + 0.3, yMin: -1.8, yMax: 1.8 }
}

export function drawWaveModesFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)

  const path = snap.trails?.path
  const L = Number(snap.values.L ?? 6)
  const n = Number(snap.values.n ?? 1)

  if (path && path.length > 1) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
  }

  drawMarker(ctx, sx(0), sy(0), { radius: 5, fill: '#fbbf24', label: '' })
  drawMarker(ctx, sx(L), sy(0), { radius: 5, fill: '#fbbf24', label: '' })

  for (let k = 1; k < n; k++) {
    const x = (k * L) / n
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
    ctx.beginPath()
    ctx.arc(sx(x), sy(0), 3.5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
  ctx.strokeRect(12, 10, Math.min(460, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `弦本征模 · n=${n}  ω=${Number(snap.values.omega ?? 0).toFixed(2)}  节点=${Number(snap.values.nodes ?? 0)}`,
    22,
    28,
    { color: 'rgba(186, 230, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '金=固定端；灰点=节点', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
