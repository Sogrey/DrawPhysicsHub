import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function fourierWorldBounds(): WorldBounds {
  return { xMin: -0.3, xMax: 6.6, yMin: -1.6, yMax: 1.6 }
}

export function drawFourierFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)

  const target = snap.trails?.target
  const path = snap.trails?.path
  if (target && target.length > 1) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    for (let i = 0; i < target.length; i++) {
      const p = target[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
    ctx.setLineDash([])
  }
  if (path && path.length > 1) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
  }

  const n = Number(snap.values.nTerms ?? 1)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 48)
  drawDiagramLabel(ctx, `傅里叶方波 · N=${n}  ε=${Number(snap.values.err ?? 0).toFixed(3)}`, 22, 28, {
    color: 'rgba(186, 230, 253, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '灰虚线=目标方波；青=部分和（Gibbs 过冲）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
