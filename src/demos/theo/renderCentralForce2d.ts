import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function centralForceWorldBounds(): WorldBounds {
  return { xMin: -4.2, xMax: 4.2, yMin: -4.2, yMax: 4.2 }
}

export function drawCentralForceFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const x = Number(snap.values.x ?? 1)
  const y = Number(snap.values.y ?? 0)
  const ax = Number(snap.values.ax ?? 0)
  const ay = Number(snap.values.ay ?? 0)
  const r = Number(snap.values.r ?? 1)
  const e = Number(snap.values.e ?? 0)
  const Lz = Number(snap.values.L ?? 0)

  const path = snap.trails?.path
  if (path && path.length > 1) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
  }

  drawMarker(ctx, sx(0), sy(0), { radius: 8, fill: '#fbbf24', label: '力心', labelDy: -14 })
  drawMarker(ctx, sx(x), sy(y), { radius: 7, fill: '#38bdf8', label: 'm', labelDx: 10 })
  const am = Math.hypot(ax, ay)
  if (am > 0.05) {
    const len = Math.min(1.2, 0.3 + am * 0.15)
    drawArrow(ctx, sx(x), sy(y), sx(x + (ax / am) * len), sy(y + (ay / am) * len), 'rgba(244,114,182,0.95)', 2.2)
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 48)
  drawDiagramLabel(ctx, `有心力 · e=${e.toFixed(2)}  r=${r.toFixed(2)}  L_z=${Lz.toFixed(2)}`, 22, 28, {
    color: 'rgba(253, 230, 138, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, 'a=−k/r² r̂；黄=轨道，粉=加速度（指向力心）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
