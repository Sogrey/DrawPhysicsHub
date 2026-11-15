import type { ObserveSnapshot } from '@/core/physics/types'

export interface Canvas2DHost {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  resize(): void
  clear(): void
  dispose(): void
}

export interface CompareTrail {
  path: number[][]
  label?: string
}

export interface ProjectileDrawOptions {
  showDecomp?: boolean
  compare?: CompareTrail | null
  /** 速度箭头：世界长度 = |v| × scale（m / (m/s)），全程固定，不因落地缩短 */
  velocityScale?: number
}

/** 默认速度箭头比例：1 m/s → 0.4 m 图上长度 */
export const VELOCITY_ARROW_SCALE = 0.4

export function createCanvas2DHost(el: HTMLCanvasElement): Canvas2DHost {
  const ctx = el.getContext('2d')
  if (!ctx) throw new Error('2D context unavailable')

  const resize = () => {
    const dpr = window.devicePixelRatio || 1
    const w = el.clientWidth || 640
    const h = el.clientHeight || 360
    el.width = Math.floor(w * dpr)
    el.height = Math.floor(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  resize()

  return {
    canvas: el,
    ctx,
    resize,
    clear() {
      ctx.clearRect(0, 0, el.clientWidth, el.clientHeight)
    },
    dispose() {
      /* noop */
    },
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 2.5,
) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  if (len < 4) return
  const ux = dx / len
  const uy = dy / len
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  const ah = 9
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - ux * ah - uy * ah * 0.45, y1 - uy * ah + ux * ah * 0.45)
  ctx.lineTo(x1 - ux * ah + uy * ah * 0.45, y1 - uy * ah - ux * ah * 0.45)
  ctx.closePath()
  ctx.fill()
}

/** Draw projectile-style trail + point in world coords (x right, y up). */
export function drawProjectileFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: { xMin: number; xMax: number; yMin: number; yMax: number },
  opts?: ProjectileDrawOptions,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1220')
  bg.addColorStop(1, '#111827')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const sx = (x: number) => ((x - world.xMin) / (world.xMax - world.xMin)) * W
  const sy = (y: number) => H - ((y - world.yMin) / (world.yMax - world.yMin)) * H

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)'
  ctx.lineWidth = 1
  const gx = Math.max(2, Math.round((world.xMax - world.xMin) / 10))
  const gy = Math.max(1, Math.round((world.yMax - world.yMin) / 8))
  for (let x = Math.ceil(world.xMin / gx) * gx; x <= world.xMax; x += gx) {
    ctx.beginPath()
    ctx.moveTo(sx(x), 0)
    ctx.lineTo(sx(x), H)
    ctx.stroke()
  }
  for (let y = Math.ceil(world.yMin / gy) * gy; y <= world.yMax; y += gy) {
    ctx.beginPath()
    ctx.moveTo(0, sy(y))
    ctx.lineTo(W, sy(y))
    ctx.stroke()
  }

  // 2D 坐标系：x 右、y 上，带箭头与轴标
  const ox = sx(0)
  const oy = sy(0)
  drawArrow(ctx, sx(world.xMin) + 8, oy, sx(world.xMax) - 10, oy, '#f87171', 1.8)
  drawArrow(ctx, ox, sy(world.yMin) + 8, ox, sy(world.yMax) + 10, '#f87171', 1.8)
  ctx.fillStyle = 'rgba(248, 113, 113, 0.95)'
  ctx.font = '13px "Segoe UI", sans-serif'
  ctx.fillText('x', sx(world.xMax) - 18, oy - 8)
  ctx.fillText('y', ox + 8, sy(world.yMax) + 16)

  const v0 = Number(snap.values.v0 ?? 20)
  const angle = Number(snap.values.angle ?? 45)
  const th = (angle * Math.PI) / 180
  const range = Number(snap.values.range ?? 0)
  const hmax = Number(snap.values.hmax ?? 0)
  const tmax = Number(snap.values.tmax ?? 0)
  const G = 9.8

  // compare (ghost) trail from player cache
  const compare = opts?.compare
  if (compare?.path && compare.path.length > 1) {
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.85)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(sx(compare.path[0]![0]!), sy(compare.path[0]![1]!))
    for (let i = 1; i < compare.path.length; i++) {
      ctx.lineTo(sx(compare.path[i]![0]!), sy(compare.path[i]![1]!))
    }
    ctx.stroke()
    ctx.setLineDash([])
    if (compare.label) {
      const last = compare.path[compare.path.length - 1]!
      ctx.fillStyle = 'rgba(244, 114, 182, 0.95)'
      ctx.font = '11px "Segoe UI", sans-serif'
      ctx.fillText(compare.label, sx(last[0]!) + 6, sy(last[1]!) - 6)
    }
  }

  if (range > 0) {
    const T = (2 * v0 * Math.sin(th)) / G
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.55)'
    ctx.setLineDash([6, 5])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    const n = 64
    for (let i = 0; i <= n; i++) {
      const tt = (T * i) / n
      const px = v0 * Math.cos(th) * tt
      const py = v0 * Math.sin(th) * tt - 0.5 * G * tt * tt
      if (i === 0) ctx.moveTo(sx(px), sy(Math.max(0, py)))
      else ctx.lineTo(sx(px), sy(Math.max(0, py)))
    }
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#a78bfa'
    ctx.beginPath()
    ctx.arc(sx(range), sy(0), 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(167, 139, 250, 0.9)'
    ctx.font = '12px "Segoe UI", sans-serif'
    ctx.fillText(`R=${range.toFixed(1)}`, sx(range) + 6, sy(0) - 8)

    if (tmax > 0) {
      const ax = v0 * Math.cos(th) * tmax
      ctx.fillStyle = 'rgba(251, 191, 36, 0.85)'
      ctx.beginPath()
      ctx.arc(sx(ax), sy(hmax), 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillText(`H=${hmax.toFixed(1)}`, sx(ax) + 6, sy(hmax) - 8)
    }
  }

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    const grad = ctx.createLinearGradient(sx(path[0]![0]!), 0, sx(path[path.length - 1]![0]!), 0)
    grad.addColorStop(0, '#38bdf8')
    grad.addColorStop(1, '#22d3ee')
    ctx.strokeStyle = grad
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(sx(path[0]![0]!), sy(path[0]![1]!))
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(sx(path[i]![0]!), sy(path[i]![1]!))
    }
    ctx.stroke()
  }

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const px = sx(x)
  const py = sy(y)

  // —— 位置投影参考线：落到 x 轴 / 贴到 y 轴 ——
  if (x > 0.02 || y > 0.05) {
    ctx.save()
    ctx.setLineDash([3, 4])
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
    if (y > 0.05) {
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px, oy)
      ctx.stroke()
    }
    if (y > 0.05) {
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(ox, py)
      ctx.stroke()
    }
    ctx.restore()

    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
    if (x > 0.02) {
      ctx.beginPath()
      ctx.arc(px, oy, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = '10px ui-monospace, Consolas, monospace'
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
      // 标注放在地面上方，避免像「负轴」溢出
      const xLabelX = Math.min(W - 64, Math.max(4, px + 4))
      ctx.fillText(`x=${x.toFixed(1)}`, xLabelX, oy - 6)
    }
    if (y > 0.15) {
      ctx.beginPath()
      ctx.arc(ox, py, 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
      ctx.fillText(`y=${y.toFixed(1)}`, Math.max(4, ox - 36), py - 4)
    }
  }

  // —— 最大高度水平参考线 + 顶点垂线 ——
  if (hmax > 0.2 && tmax > 0) {
    const ax = v0 * Math.cos(th) * tmax
    const apexX = sx(ax)
    const apexY = sy(hmax)
    ctx.save()
    ctx.setLineDash([4, 5])
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)'
    ctx.beginPath()
    ctx.moveTo(ox, apexY)
    ctx.lineTo(Math.max(apexX, sx(range)), apexY)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'
    ctx.beginPath()
    ctx.moveTo(apexX, apexY)
    ctx.lineTo(apexX, oy)
    ctx.stroke()
    ctx.restore()
  }

  // —— 射程竖直参考线 ——
  if (range > 0.5) {
    ctx.save()
    ctx.setLineDash([4, 5])
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)'
    ctx.beginPath()
    ctx.moveTo(sx(range), oy)
    ctx.lineTo(sx(range), sy(Math.min(hmax * 0.35, hmax)))
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = '#94a3b8'
  ctx.beginPath()
  ctx.arc(ox, oy, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillText('O', ox - 12, oy + 14)

  const glow = ctx.createRadialGradient(px, py, 0, px, py, 16)
  glow.addColorStop(0, 'rgba(239, 68, 68, 0.45)')
  glow.addColorStop(1, 'rgba(239, 68, 68, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(px, py, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(px, py, 6.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(254, 202, 202, 0.8)'
  ctx.lineWidth = 1
  ctx.stroke()

  const vx = Number(snap.values.vx ?? 0)
  const vy = Number(snap.values.vy ?? 0)
  // 固定比例：箭头长度与 |v| 成正比；视口应预留负向边距，而不是缩短箭头
  const scale = opts?.velocityScale ?? VELOCITY_ARROW_SCALE

  const tipVxX = sx(x + vx * scale)
  const tipVxY = sy(y)
  const tipVyX = sx(x)
  const tipVyY = sy(y + vy * scale)
  const tipVX = sx(x + vx * scale)
  const tipVY = sy(y + vy * scale)

  // 仅文字避让画布边缘，不改箭头几何
  const clampLabel = (lx: number, ly: number) => ({
    x: Math.min(W - 28, Math.max(4, lx)),
    y: Math.min(H - 4, Math.max(12, ly)),
  })

  if (opts?.showDecomp !== false) {
    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1.25
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)'
    ctx.beginPath()
    ctx.moveTo(tipVxX, tipVxY)
    ctx.lineTo(tipVX, tipVY)
    ctx.lineTo(tipVyX, tipVyY)
    ctx.stroke()
    ctx.fillStyle = 'rgba(74, 222, 128, 0.06)'
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(tipVxX, tipVxY)
    ctx.lineTo(tipVX, tipVY)
    ctx.lineTo(tipVyX, tipVyY)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    drawArrow(ctx, px, py, tipVxX, tipVxY, '#60a5fa', 2)
    drawArrow(ctx, px, py, tipVyX, tipVyY, '#fbbf24', 2)
    const lx = clampLabel(tipVxX + 4, tipVxY + 12)
    const ly = clampLabel(tipVyX + 6, tipVyY - 4)
    ctx.fillStyle = 'rgba(96, 165, 250, 0.95)'
    ctx.font = '11px "Segoe UI", sans-serif'
    ctx.fillText('vₓ', lx.x, lx.y)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.95)'
    ctx.fillText('vᵧ', ly.x, ly.y)
  }

  drawArrow(ctx, px, py, tipVX, tipVY, '#4ade80', 2.5)
  const lv = clampLabel(tipVX + 4, tipVY - 4)
  ctx.fillStyle = 'rgba(74, 222, 128, 0.95)'
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillText('v', lv.x, lv.y)

  const lc = clampLabel(px + 10, py - 10)
  ctx.fillStyle = 'rgba(226, 232, 240, 0.75)'
  ctx.font = '12px ui-monospace, Consolas, monospace'
  ctx.fillText(`(${x.toFixed(2)}, ${y.toFixed(2)})`, lc.x, lc.y)
}
