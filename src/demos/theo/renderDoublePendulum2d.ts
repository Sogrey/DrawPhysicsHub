import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function doublePendulumWorldBounds(world: number): WorldBounds {
  const w = Math.max(2.5, world)
  return { xMin: -w, xMax: w, yMin: -w - 0.2, yMax: w * 0.35 }
}

export function drawDoublePendulumFrame(
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
  const y2 = Number(snap.values.y2 ?? 0)
  const th1 = Number(snap.values.th1 ?? 0)
  const th2 = Number(snap.values.th2 ?? 0)
  const E = Number(snap.values.E ?? 0)

  // trail of bob 2
  const path = snap.trails?.path
  if (path && path.length > 1) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      const px = sx(p[0]!)
      const py = sy(p[1]!)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  // rods
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.95)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(0))
  ctx.lineTo(sx(x1), sy(y1))
  ctx.lineTo(sx(x2), sy(y2))
  ctx.stroke()

  drawMarker(ctx, sx(0), sy(0), { radius: 5, fill: '#94a3b8', label: '支点', labelDy: -14 })
  drawMarker(ctx, sx(x1), sy(y1), { radius: 8, fill: '#fbbf24', label: 'm₁', labelDx: 10 })
  drawMarker(ctx, sx(x2), sy(y2), { radius: 9, fill: '#38bdf8', label: 'm₂', labelDx: 10 })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(520, W - 24), 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(12, 10, Math.min(520, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `双摆 · θ₁=${th1.toFixed(1)}°  θ₂=${th2.toFixed(1)}°  E=${E.toFixed(2)}`,
    22,
    28,
    { color: 'rgba(196, 181, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '黄轨迹=下摆端点；大角度初态对微扰敏感（混沌）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
