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

export function precessionWorldBounds(): WorldBounds {
  return { xMin: -3.2, xMax: 3.2, yMin: -0.6, yMax: 3.4 }
}

export function drawPrecessionFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const ax = Number(snap.values.ax ?? 0)
  const ay = Number(snap.values.ay ?? 1)
  const az = Number(snap.values.az ?? 0)
  const tilt = Number(snap.values.tiltDeg ?? 25)
  const OmP = Number(snap.values.OmP ?? 0)
  const phi = Number(snap.values.phi ?? 0)
  // 俯视投影：水平面 (ax, az)
  const r = Math.hypot(ax, az)

  // cone base circle
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  const n = 48
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n
    const px = sx(r * Math.cos(a))
    const py = sy(0.15 + r * Math.sin(a) * 0.15)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.setLineDash([])

  // vertical
  drawArrow(ctx, sx(0), sy(0), sx(0), sy(2.4), 'rgba(56, 189, 248, 0.7)', 2)
  drawDiagramLabel(ctx, '竖直', sx(0.15), sy(2.3), { color: '#38bdf8' })

  // spin axis (side view mix: x vs height)
  drawArrow(ctx, sx(0), sy(0), sx(ax), sy(ay), 'rgba(251, 191, 36, 0.98)', 3)
  drawMarker(ctx, sx(ax), sy(ay), { radius: 6, fill: '#fbbf24', label: '轴尖', labelDx: 8 })
  drawMarker(ctx, sx(0), sy(0), { radius: 5, fill: '#94a3b8', label: '支点', labelDy: 16 })

  drawDiagramLabel(ctx, `θ=${tilt.toFixed(0)}°  Ωₚ=${OmP.toFixed(3)}  φ=${phi.toFixed(0)}°`, sx(-2.9), sy(3.1), {
    color: 'rgba(226,232,240,0.95)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '紫圈≈进动圆锥底；金箭=自旋轴（侧视）', sx(-2.9), sy(2.85), {
    color: 'rgba(148,163,184,0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 44)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 44)
  drawDiagramLabel(ctx, `陀螺进动 · Ωₚ≈Mgh/(I₃ω₃)=${OmP.toFixed(3)}`, 22, 28, {
    color: 'rgba(253, 230, 138, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '自旋↑ → 进动↓；倾角决定圆锥开角', 22, 44, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
