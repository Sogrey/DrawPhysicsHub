import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function malusWorldBounds(world: number): WorldBounds {
  return {
    xMin: -0.4,
    xMax: world + 0.6,
    yMin: -world * 0.5,
    yMax: world * 0.5,
  }
}

/** θ=0 → 透振轴竖直（与教材图一致） */
function axisScreenDeg(thetaWorld: number): number {
  return 90 - thetaWorld
}

function drawDoubleArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleDeg: number,
  halfLen: number,
  color: string,
  width = 2,
): void {
  const th = (angleDeg * Math.PI) / 180
  // screen: y down; math angle with y-up → flip
  const ux = Math.cos(th)
  const uy = -Math.sin(th)
  const x0 = x - ux * halfLen
  const y0 = y - uy * halfLen
  const x1 = x + ux * halfLen
  const y1 = y + uy * halfLen
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  const ah = 6
  for (const [bx, by, dir] of [
    [x1, y1, 1],
    [x0, y0, -1],
  ] as const) {
    const dx = ux * dir
    const dy = uy * dir
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.lineTo(bx - dx * ah - dy * ah * 0.45, by - dy * ah + dx * ah * 0.45)
    ctx.lineTo(bx - dx * ah + dy * ah * 0.45, by - dy * ah - dx * ah * 0.45)
    ctx.closePath()
    ctx.fill()
  }
}

/** 自然光截面：各方向振动（星芒） */
function drawUnpolarizedBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
  ctx.setLineDash([4, 3])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  for (let i = 0; i < 8; i++) {
    const th = (i * Math.PI) / 4
    drawDoubleArrow(
      ctx,
      cx,
      cy,
      (th * 180) / Math.PI,
      r * 0.72,
      'rgba(148, 163, 184, 0.95)',
      1.6,
    )
  }
  ctx.restore()
}

/** 沿光路：自然光 = 竖直双箭头 + 出纸面圆点 */
function drawNaturalSegment(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  cy: number,
): void {
  // 教材：自然光路 = 绿色主轴 + 竖向双箭头 + 出纸面圆点
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(x0, cy)
  ctx.lineTo(x1, cy)
  ctx.stroke()
  const n = 4
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n
    drawDoubleArrow(ctx, x, cy, 90, 16, 'rgba(74, 222, 128, 0.95)', 1.8)
    ctx.fillStyle = 'rgba(34, 197, 94, 0.95)'
    ctx.beginPath()
    ctx.arc(x + 10, cy, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x - 10, cy, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** 线偏光段：仅沿透振方向的双箭头，长度∝振幅 */
function drawLinearSegment(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  cy: number,
  axisDeg: number,
  amp: number,
  color: string,
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 2.2
  ctx.globalAlpha = 0.35 + 0.65 * Math.min(1, amp)
  ctx.beginPath()
  ctx.moveTo(x0, cy)
  ctx.lineTo(x1, cy)
  ctx.stroke()
  ctx.globalAlpha = 1
  const n = 5
  const half = 8 + 14 * Math.min(1, amp)
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n
    drawDoubleArrow(ctx, x, cy, axisDeg, half, color, 1.9)
  }
}

/**
 * 偏振片圆盘：透振方向平行刻线（教材画法）+ 可旋转弯箭头
 */
function drawPolarizerDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  axisDeg: number,
  opts: { label: string; showRotate?: boolean; tint?: string },
): void {
  ctx.save()
  ctx.translate(cx, cy)
  const tint = opts.tint ?? 'rgba(125, 211, 252, 0.35)'
  ctx.fillStyle = tint
  ctx.strokeStyle = 'rgba(56, 189, 250, 0.95)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // 刻线平行于透振轴
  const th = (axisDeg * Math.PI) / 180
  const ux = Math.cos(th)
  const uy = -Math.sin(th) // screen y
  const px = -uy
  const py = ux
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)'
  ctx.lineWidth = 1.5
  for (let i = -5; i <= 5; i++) {
    const o = i * (r / 6)
    const cx0 = px * o
    const cy0 = py * o
    if (Math.hypot(cx0, cy0) > r * 0.92) continue
    const half = Math.sqrt(Math.max(0, r * r * 0.88 - o * o))
    ctx.beginPath()
    ctx.moveTo(cx0 - ux * half, cy0 - uy * half)
    ctx.lineTo(cx0 + ux * half, cy0 + uy * half)
    ctx.stroke()
  }

  if (opts.showRotate) {
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.95)'
    ctx.fillStyle = 'rgba(96, 165, 250, 0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, r + 10, -1.1, 0.4, false)
    ctx.stroke()
    // arrow head at end of arc
    const ang = 0.4
    const ax = (r + 10) * Math.cos(ang)
    const ay = (r + 10) * Math.sin(ang)
    const tx = -Math.sin(ang)
    const ty = Math.cos(ang)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(ax - tx * 8 - ty * 4, ay - ty * 8 + tx * 4)
    ctx.lineTo(ax - tx * 8 + ty * 4, ay - ty * 8 - tx * 4)
    ctx.closePath()
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(226, 232, 240, 0.98)'
  ctx.font = '13px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(opts.label, 0, r + 20)
  ctx.restore()
}

function drawScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  I2: number,
  Iref: number,
): void {
  const w = 36
  const h = 110
  ctx.fillStyle = 'rgba(51, 65, 85, 0.95)'
  ctx.fillRect(x, cy - h / 2, w, h)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, cy - h / 2, w, h)

  const bright = Math.min(1, I2 / Math.max(Iref * 0.5, 1e-6))
  const spotR = 5 + 24 * bright
  // 教材屏斑：亮时青绿，暗时近黑
  const g = ctx.createRadialGradient(x + w / 2, cy, 0, x + w / 2, cy, spotR)
  g.addColorStop(0, `rgba(190, 242, 100, ${0.25 + 0.75 * bright})`)
  g.addColorStop(0.5, `rgba(74, 222, 128, ${0.12 + 0.55 * bright})`)
  g.addColorStop(1, 'rgba(15, 23, 42, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x + w / 2, cy, spotR, 0, Math.PI * 2)
  ctx.fill()
  if (bright < 0.08) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
    ctx.beginPath()
    ctx.arc(x + w / 2, cy, 10, 0, Math.PI * 2)
    ctx.fill()
  }

  drawDiagramLabel(ctx, '屏', x + 6, cy - h / 2 - 12, { color: 'rgba(226,232,240,0.9)' })
}

/** 对应教材三态：平行最大 / 夹角∝cos² / 垂直为零 */
function statusText(theta: number, cos2: number): string {
  const a = Math.abs(((theta % 180) + 180) % 180)
  if (a < 12 || a > 168) return '相互平行 · 光强最大'
  if (Math.abs(a - 90) < 12) return '相互垂直 · 光强为零'
  return `夹角 θ=${theta.toFixed(0)}° · I ∝ cos²θ = ${cos2.toFixed(3)}`
}

export function drawMalusFrame(
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

  const I0 = Number(snap.values.I0 ?? 1)
  const I1 = Number(snap.values.I1 ?? 0.5)
  const I2 = Number(snap.values.I2 ?? 0)
  const thetaP = Number(snap.values.thetaP ?? 0)
  const thetaA = Number(snap.values.thetaA ?? 0)
  const theta = Number(snap.values.theta ?? 0)
  const cos2 = Number(snap.values.cos2 ?? 0)

  const cy = sy(0)
  const xBadge = 0.15
  const xNat0 = 0.85
  const xP = 2.0
  const xA = 3.7
  const xScreen = 5.2
  const rDisk = Math.min(52, Math.abs(sy(-0.85) - sy(0.85)) * 0.38)

  const axisP = axisScreenDeg(thetaP)
  const axisA = axisScreenDeg(thetaA)

  // —— ① 自然光星芒 ——
  drawUnpolarizedBadge(ctx, sx(xBadge), cy, 28)
  drawDiagramLabel(ctx, '自然光', sx(xBadge) - 18, cy - 42, {
    color: 'rgba(148, 163, 184, 0.95)',
  })

  // —— 自然光路段 ——
  drawNaturalSegment(ctx, sx(xNat0), sx(xP) - rDisk - 6, cy)
  drawDiagramLabel(ctx, '自然光', (sx(xNat0) + sx(xP) - rDisk) / 2 - 16, cy - 36, {
    color: 'rgba(148, 163, 184, 0.85)',
  })

  // —— 起偏器 ——
  drawPolarizerDisk(ctx, sx(xP), cy, rDisk, axisP, {
    label: '起偏器',
    tint: 'rgba(167, 139, 250, 0.32)',
  })

  // —— 线偏振光 ——
  const amp1 = Math.sqrt(I1 / Math.max(I0, 1e-6))
  drawLinearSegment(
    ctx,
    sx(xP) + rDisk + 6,
    sx(xA) - rDisk - 6,
    cy,
    axisP,
    amp1,
    'rgba(74, 222, 128, 0.95)',
  )
  drawDiagramLabel(ctx, '线偏振光', (sx(xP) + sx(xA)) / 2 - 20, cy - 40, {
    color: 'rgba(74, 222, 128, 0.95)',
  })

  // —— 检偏器（可旋转） ——
  drawPolarizerDisk(ctx, sx(xA), cy, rDisk, axisA, {
    label: '检偏器',
    showRotate: true,
    tint: 'rgba(56, 189, 248, 0.32)',
  })

  // 夹角弧（仅当两轴不重合时）
  const axisDiff = Math.abs((((theta % 180) + 180) % 180) - 0)
  if (axisDiff > 8 && Math.abs(axisDiff - 90) > 4) {
    ctx.save()
    ctx.translate(sx(xA), cy)
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.95)'
    ctx.lineWidth = 2
    const start = (-axisP * Math.PI) / 180
    const end = (-axisA * Math.PI) / 180
    let dlt = end - start
    while (dlt > Math.PI) dlt -= 2 * Math.PI
    while (dlt < -Math.PI) dlt += 2 * Math.PI
    ctx.beginPath()
    ctx.arc(0, 0, rDisk + 14, start, start + dlt, dlt < 0)
    ctx.stroke()
    ctx.fillStyle = 'rgba(167, 139, 250, 0.95)'
    ctx.font = 'bold 13px "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`θ=${theta.toFixed(0)}°`, 8, -(rDisk + 22))
    ctx.restore()
  }

  // —— 透射光 ——
  const amp2 = Math.sqrt(I2 / Math.max(I1, 1e-6))
  if (I2 > 0.02) {
    drawLinearSegment(
      ctx,
      sx(xA) + rDisk + 6,
      sx(xScreen) - 8,
      cy,
      axisA,
      amp2,
      'rgba(125, 211, 252, 0.95)',
    )
  } else {
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(sx(xA) + rDisk + 6, cy)
    ctx.lineTo(sx(xScreen) - 8, cy)
    ctx.stroke()
    ctx.setLineDash([])
    drawDiagramLabel(ctx, '消光', sx(xA) + rDisk + 20, cy - 18, {
      color: 'rgba(248, 113, 113, 0.9)',
    })
  }

  // —— 屏 ——
  drawScreen(ctx, sx(xScreen), cy, I2, I0)

  // 状态条：屏幕坐标贴顶，避开 y 轴箭头与视口裁切
  const status = statusText(theta, cos2)
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(440, W - 24)
  const boxH = 44
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
  ctx.fillRect(boxX, boxY, boxW, boxH)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, boxH)
  drawDiagramLabel(ctx, status, boxX + 10, boxY + 16, {
    color: 'rgba(125, 211, 252, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `I₁=I₀/2=${I1.toFixed(2)}   I₂=I₁ cos²θ=${I2.toFixed(3)}   播放：检偏器旋转`,
    boxX + 10,
    boxY + 34,
    { color: 'rgba(226, 232, 240, 0.88)', font: '11px "Segoe UI", sans-serif' },
  )
}
