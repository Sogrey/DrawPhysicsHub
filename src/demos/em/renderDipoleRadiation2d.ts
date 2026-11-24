import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function dipoleRadiationWorldBounds(world: number): WorldBounds {
  const w = Math.max(3.2, world)
  return { xMin: -w, xMax: w, yMin: -w, yMax: w }
}

export function drawDipoleRadiationFrame(
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

  const path = snap.trails?.path
  if (path && path.length > 2) {
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.9)'
    ctx.fillStyle = 'rgba(167, 139, 250, 0.18)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  const p = Number(snap.values.p ?? 0)
  const half = 0.35 + 0.55 * Math.abs(p)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(-half))
  ctx.lineTo(sx(0), sy(half))
  ctx.stroke()
  drawMarker(ctx, sx(0), sy(half), { radius: 6, fill: '#f87171', label: '+', labelDy: -12 })
  drawMarker(ctx, sx(0), sy(-half), { radius: 6, fill: '#60a5fa', label: '−', labelDy: 14 })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `偶极辐射 · p=${p.toFixed(2)}  方向图∝sin²θ`,
    22,
    28,
    { color: 'rgba(196, 181, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '轴向无辐射；赤道最强。紫=瞬时花瓣', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
