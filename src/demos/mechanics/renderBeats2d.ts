import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function beatsWorldBounds(period: number): WorldBounds {
  return { xMin: -0.3, xMax: period + 0.3, yMin: -2.4, yMax: 2.4 }
}

export function drawBeatsFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)

  const env = snap.trails?.env
  if (env && env.length > 2) {
    ctx.strokeStyle = 'rgba(251,191,36,0.55)'
    ctx.setLineDash([4, 3])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < env.length; i += 2) {
      const p = env[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
    ctx.beginPath()
    for (let i = 1; i < env.length; i += 2) {
      const p = env[i]!
      if (i === 1) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
    ctx.setLineDash([])
  }
  const path = snap.trails?.path
  if (path && path.length > 1) {
    ctx.strokeStyle = 'rgba(56,189,248,0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
  }
  drawMarker(ctx, sx(Number(snap.time ?? 0)), sy(Number(snap.values.y ?? 0)), {
    radius: 5,
    fill: '#fbbf24',
    label: '',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
  ctx.strokeStyle = 'rgba(56,189,248,0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `拍 · |Δf|=${Number(snap.values.df ?? 0).toFixed(2)} Hz  T_拍=${Number(snap.values.Tbeat ?? 0).toFixed(2)} s`,
    22,
    28,
    { color: 'rgba(186,230,253,0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '金虚线=包络；金点=当前时刻', 22, 46, {
    color: 'rgba(226,232,240,0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
