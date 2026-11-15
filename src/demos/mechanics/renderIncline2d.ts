import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawAngleMark,
  drawDashedPath,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function inclineWorldBounds(L: number, thetaDeg: number): WorldBounds {
  const th = (thetaDeg * Math.PI) / 180
  const Hx = L * Math.cos(th)
  const Hy = L * Math.sin(th)
  const pad = Math.max(0.8, L * 0.18)
  return {
    xMin: -pad,
    xMax: Hx + pad,
    yMin: -pad * 0.45,
    yMax: Hy + pad,
  }
}

export function drawInclineFrame(
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
  const map = { sx, sy }

  const L = Number(snap.values.L ?? 4)
  const thetaDeg = Number(snap.values.theta ?? 30)
  const mu = Number(snap.values.mu ?? 0)
  const th = (thetaDeg * Math.PI) / 180
  const Hx = L * Math.cos(th)
  const Hy = L * Math.sin(th)

  // wedge（斜面体在斜面下方）
  ctx.fillStyle = 'rgba(51, 65, 85, 0.55)'
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(0))
  ctx.lineTo(sx(Hx), sy(0))
  ctx.lineTo(sx(0), sy(Hy))
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // incline surface
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(Hy))
  ctx.lineTo(sx(Hx), sy(0))
  ctx.stroke()

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.85)',
      label: opts.compare.label,
    })
  }

  const s = Number(snap.values.s ?? 0)
  const bx = s * Math.cos(th)
  const by = Hy - s * Math.sin(th)

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(sx(path[0]![0]!), sy(path[0]![1]!))
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(sx(path[i]![0]!), sy(path[i]![1]!))
    }
    ctx.stroke()
  }

  // 木箱：按斜面在屏幕上的实际倾角旋转（sx/sy 非等比时 ≠ θ），底边贴在斜面上
  const side = 36
  const p0x = sx(0)
  const p0y = sy(Hy)
  const p1x = sx(Hx)
  const p1y = sy(0)
  const screenAngle = Math.atan2(p1y - p0y, p1x - p0x)
  const contactX = sx(bx)
  const contactY = sy(by)
  ctx.save()
  ctx.translate(contactX, contactY)
  ctx.rotate(screenAngle)
  // 局部 +x 沿斜面向下，+y 指向楔形内侧；底边 y=0 贴斜面，箱体向 -y（外侧）伸出
  ctx.fillStyle = '#38bdf8'
  ctx.fillRect(-side / 2, -side, side, side)
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.9)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(-side / 2, -side, side, side)
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)'
  ctx.beginPath()
  ctx.moveTo(-side / 2, -side / 2)
  ctx.lineTo(side / 2, -side / 2)
  ctx.stroke()
  ctx.restore()

  // 箱心 = 接触点沿屏幕外法向抬起 side/2（局部 -y → 屏幕 (sin α, -cos α)）
  const midX = contactX + Math.sin(screenAngle) * (side / 2)
  const midY = contactY - Math.cos(screenAngle) * (side / 2)
  const v = Number(snap.values.v ?? 0)
  const alongPx = Math.min(72, Math.abs(v) * 14)
  if (alongPx > 2) {
    const dir = v >= 0 ? 1 : -1
    ctx.strokeStyle = '#4ade80'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(midX, midY)
    ctx.lineTo(
      midX + Math.cos(screenAngle) * alongPx * dir,
      midY + Math.sin(screenAngle) * alongPx * dir,
    )
    ctx.stroke()
  }

  // —— 参数标注（屏幕角，避免与坐标轴/斜面压线）——
  const footX = sx(Hx)
  const footY = sy(0)
  const aBase = Math.atan2(sy(0) - footY, sx(0) - footX) // 沿底边指向原点
  const aIncline = Math.atan2(sy(Hy) - footY, sx(0) - footX) // 沿斜面指向上端
  const arcR = Math.max(32, Math.min(52, Math.hypot(footX - sx(0), footY - sy(0)) * 0.12))
  drawAngleMark(ctx, footX, footY, arcR, aBase, aIncline, `θ=${thetaDeg.toFixed(0)}°`, {
    labelDistance: arcR + 20,
  })
  drawDimLine(ctx, sx(0), sy(Hy), sx(Hx), sy(0), `L=${L.toFixed(1)} m`, {
    offset: -28,
    labelGap: 14,
    color: 'rgba(167, 139, 250, 0.95)',
  })
  // μ 放在楔形内部偏下，避开斜面与坐标轴
  drawDiagramLabel(ctx, `μ=${mu.toFixed(2)}`, sx(Hx * 0.38), sy(Hy * 0.18), {
    color: 'rgba(251, 191, 36, 0.95)',
    align: 'center',
  })
  drawDiagramLabel(ctx, '斜面', sx(Hx * 0.28), sy(Hy * 0.38), {
    color: 'rgba(148, 163, 184, 0.75)',
    font: '11px "Segoe UI", sans-serif',
    align: 'center',
  })

  drawMarker(ctx, ox, oy, { radius: 2.5, fill: 'rgba(148,163,184,0.85)', label: 'O' })

  if (Number(snap.values.sliding ?? 1) === 0) {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.font = '12px "Segoe UI", sans-serif'
    ctx.fillText('静摩擦过大，未下滑', sx(Hx * 0.15), sy(Hy * 0.55))
  }
}
