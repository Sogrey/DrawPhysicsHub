import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function collisionInelasticWorldBounds(snap: ObserveSnapshot): WorldBounds {
  const x1 = Number(snap.values.x1 ?? -3)
  const x2 = Number(snap.values.x2 ?? 2)
  const lo = Math.min(x1, x2, -5)
  const hi = Math.max(x1, x2, 5)
  return { xMin: lo - 1.5, xMax: hi + 1.5, yMin: -2.2, yMax: 2.4 }
}

export function drawCollisionInelasticFrame(
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
  const x1 = Number(snap.values.x1 ?? 0)
  const x2 = Number(snap.values.x2 ?? 0)
  const r1 = Number(snap.values.r1 ?? 0.4)
  const r2 = Number(snap.values.r2 ?? 0.4)
  const pr1 = Math.abs(sx(x1 + r1) - sx(x1))
  const pr2 = Math.abs(sx(x2 + r2) - sx(x2))
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(sx(x1), sy(0), pr1, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f97316'
  ctx.beginPath()
  ctx.arc(sx(x2), sy(0), pr2, 0, Math.PI * 2)
  ctx.fill()
  drawMarker(ctx, sx(x1), sy(0), { radius: 2, fill: '#fff', label: '1', labelDy: -14 })
  drawMarker(ctx, sx(x2), sy(0), { radius: 2, fill: '#fff', label: '2', labelDy: -14 })

  const e = Number(snap.values.e ?? 0)
  const dK = Number(snap.values.dK ?? 0)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `非弹性碰撞 · e=${e.toFixed(2)}  ΔK=${dK.toFixed(2)}  P=${Number(snap.values.P ?? 0).toFixed(2)}`,
    22,
    28,
    { color: 'rgba(254, 215, 170, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '动量守恒；e<1 时动能损失', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
