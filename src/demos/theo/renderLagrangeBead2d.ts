import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function lagrangeBeadWorldBounds(world: number): WorldBounds {
  const w = Math.max(3.2, world)
  return { xMin: -w, xMax: w, yMin: -w, yMax: w }
}

export function drawLagrangeBeadFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const r = Number(snap.values.r ?? 0.5)
  const Omega = Number(snap.values.Omega ?? 1)
  const phi = (Number(snap.values.phiDeg ?? 0) * Math.PI) / 180

  const rodLen = Math.min(world.xMax - 0.3, 3.2)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(0))
  ctx.lineTo(sx(rodLen * Math.cos(phi)), sy(rodLen * Math.sin(phi)))
  ctx.stroke()

  const path = snap.trails?.path
  if (path && path.length > 1) {
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
  }

  drawMarker(ctx, sx(0), sy(0), { radius: 4, fill: '#94a3b8', label: '轴', labelDy: -12 })
  drawMarker(ctx, sx(x), sy(y), { radius: 8, fill: '#38bdf8', label: '珠', labelDx: 10 })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(500, W - 24), 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(12, 10, Math.min(500, W - 24), 48)
  drawDiagramLabel(ctx, `拉格朗日珠 · r=${r.toFixed(2)}  Ω=${Omega.toFixed(2)}  r̈=Ω²r`, 22, 28, {
    color: 'rgba(196, 181, 253, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '广义坐标仅 r；黄=杆，紫=轨迹（螺旋外扩）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
