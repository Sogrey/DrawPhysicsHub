import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function rollingWorldBounds(R: number, xMax: number): WorldBounds {
  const padX = Math.max(0.8, R * 0.6)
  const padY = Math.max(0.5, R * 0.45)
  return {
    xMin: -padX,
    xMax: Math.max(xMax, R * 2) + padX,
    yMin: -padY * 0.3,
    yMax: 2.4 * R + padY,
  }
}

export function drawRollingFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
  opts?: { compare?: CompareTrail | null },
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const { sx, sy, ox, oy } = drawGridAndAxes2D(ctx, world, W, H)

  const R = Number(snap.values.R ?? 1)
  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? R)
  const thetaRad = (Number(snap.values.theta ?? 0) * Math.PI) / 180
  const v = Number(snap.values.v ?? 0)
  const omega = Number(snap.values.omega ?? 0)
  const kappa = Number(snap.values.kappa ?? 0.5)

  // 地面
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), sy(0))
  ctx.lineTo(sx(world.xMax), sy(0))
  ctx.stroke()
  // 地面纹理短线
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)'
  ctx.lineWidth = 1
  for (let gx = Math.ceil(world.xMin); gx < world.xMax; gx += 0.5) {
    ctx.beginPath()
    ctx.moveTo(sx(gx), sy(0))
    ctx.lineTo(sx(gx - 0.15), sy(-0.12))
    ctx.stroke()
  }

  // 对比：纯滑动质心高度线（同速）
  if (opts?.compare?.path?.length) {
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)'
    ctx.setLineDash([5, 4])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    const c0 = opts.compare.path[0]!
    ctx.moveTo(sx(c0[0]!), sy(c0[1]!))
    for (let i = 1; i < opts.compare.path.length; i++) {
      ctx.lineTo(sx(opts.compare.path[i]![0]!), sy(opts.compare.path[i]![1]!))
    }
    ctx.stroke()
    ctx.setLineDash([])
    if (opts.compare.label) {
      const last = opts.compare.path[opts.compare.path.length - 1]!
      ctx.fillStyle = 'rgba(244, 114, 182, 0.95)'
      ctx.font = '11px "Segoe UI", sans-serif'
      ctx.fillText(opts.compare.label, sx(last[0]!) - 40, sy(last[1]!) - 8)
    }
  }

  // 轮缘摆线
  const rim = snap.trails?.rim ?? []
  if (rim.length > 1) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(sx(rim[0]![0]!), sy(rim[0]![1]!))
    for (let i = 1; i < rim.length; i++) {
      ctx.lineTo(sx(rim[i]![0]!), sy(rim[i]![1]!))
    }
    ctx.stroke()
  }

  // 质心轨迹
  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
    ctx.lineWidth = 1.75
    ctx.beginPath()
    ctx.moveTo(sx(path[0]![0]!), sy(path[0]![1]!))
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(sx(path[i]![0]!), sy(path[i]![1]!))
    }
    ctx.stroke()
  }

  const cx = sx(x)
  const cy = sy(y)
  // 屏幕上圆的半径（取 x 向尺度近似；非等比时用平均）
  const rPx = Math.abs(sx(x + R) - sx(x))

  // 轮盘
  ctx.beginPath()
  ctx.arc(cx, cy, rPx, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(56, 189, 248, 0.18)'
  ctx.fill()
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // 辐条（随 θ 旋转；canvas 中 θ 增大为逆时针，我们的 theta 为物理角）
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)'
  ctx.lineWidth = 1.5
  for (let k = 0; k < 4; k++) {
    const a = -thetaRad + (k * Math.PI) / 2 // 屏幕：顺时针滚动 → 视觉顺时针
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a) * rPx, cy + Math.sin(a) * rPx)
    ctx.stroke()
  }

  // 轮缘标记点
  const rimX = Number(snap.values.rimX ?? x)
  const rimY = Number(snap.values.rimY ?? 0)
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(sx(rimX), sy(rimY), 5, 0, Math.PI * 2)
  ctx.fill()

  // 质心
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2)
  ctx.fill()

  // 速度箭头（质心）
  if (Math.abs(v) > 0.05) {
    drawArrow(ctx, cx, cy, sx(x + Math.min(1.2, v * 0.55)), cy, '#4ade80', 2.2)
  }

  // 角速度弧（轮盘旁）
  if (Math.abs(omega) > 0.05) {
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.9)'
    ctx.lineWidth = 1.75
    ctx.beginPath()
    ctx.arc(cx, cy, rPx * 0.55, -0.4, 1.1, false)
    ctx.stroke()
    drawDiagramLabel(ctx, 'ω', cx + rPx * 0.62, cy - rPx * 0.15, {
      color: 'rgba(167, 139, 250, 0.95)',
      font: '12px "Segoe UI", sans-serif',
    })
  }

  drawMarker(ctx, ox, oy, { radius: 2.5, fill: 'rgba(148,163,184,0.85)', label: 'O' })

  // —— 参数标注 ——
  drawDimLine(ctx, sx(x), sy(0), sx(x), sy(R), `R=${R.toFixed(1)} m`, {
    offset: 18,
    labelGap: 14,
    color: 'rgba(167, 139, 250, 0.95)',
  })
  drawDiagramLabel(ctx, `v=${v.toFixed(2)} m/s`, cx + 10, cy - rPx - 14, {
    color: 'rgba(74, 222, 128, 0.95)',
  })
  drawDiagramLabel(ctx, `ω=${omega.toFixed(2)} rad/s`, cx + 10, cy - rPx - 30, {
    color: 'rgba(167, 139, 250, 0.95)',
  })
  drawDiagramLabel(ctx, `κ=${kappa.toFixed(2)}`, sx(world.xMin) + 10, sy(world.yMax) + 14, {
    color: 'rgba(251, 191, 36, 0.95)',
  })
  drawDiagramLabel(ctx, 'v=ωR', sx(world.xMin) + 10, sy(world.yMax) + 30, {
    color: 'rgba(148, 163, 184, 0.85)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '地面', sx(world.xMax) - 8, sy(0) + 14, {
    color: 'rgba(148, 163, 184, 0.7)',
    align: 'right',
    font: '11px "Segoe UI", sans-serif',
  })
}
