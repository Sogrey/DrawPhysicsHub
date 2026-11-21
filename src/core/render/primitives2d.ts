export type WorldBounds = { xMin: number; xMax: number; yMin: number; yMax: number }

export type ScreenMapper = {
  sx: (x: number) => number
  sy: (y: number) => number
}

/** 深色视口背景渐变 */
export function fillDarkViewport(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
): void {
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1220')
  bg.addColorStop(1, '#111827')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
}

/** 世界坐标折线 */
export function drawTrailPolyline(
  ctx: CanvasRenderingContext2D,
  path: number[][],
  map: ScreenMapper,
  opts?: { strokeStyle?: string | CanvasGradient; lineWidth?: number },
): void {
  if (path.length < 2) return
  ctx.strokeStyle = opts?.strokeStyle ?? '#38bdf8'
  ctx.lineWidth = opts?.lineWidth ?? 2.5
  ctx.beginPath()
  ctx.moveTo(map.sx(path[0]![0]!), map.sy(path[0]![1]!))
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(map.sx(path[i]![0]!), map.sy(path[i]![1]!))
  }
  ctx.stroke()
}

/** 虚线折线（对比轨迹 / 理论曲线） */
export function drawDashedPath(
  ctx: CanvasRenderingContext2D,
  path: number[][],
  map: ScreenMapper,
  opts?: {
    strokeStyle?: string
    lineWidth?: number
    dash?: number[]
    label?: string
    labelColor?: string
  },
): void {
  if (path.length < 2) return
  ctx.save()
  ctx.strokeStyle = opts?.strokeStyle ?? 'rgba(244, 114, 182, 0.85)'
  ctx.lineWidth = opts?.lineWidth ?? 2
  ctx.setLineDash(opts?.dash ?? [4, 4])
  ctx.beginPath()
  ctx.moveTo(map.sx(path[0]![0]!), map.sy(path[0]![1]!))
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(map.sx(path[i]![0]!), map.sy(path[i]![1]!))
  }
  ctx.stroke()
  ctx.setLineDash([])
  if (opts?.label) {
    const last = path[path.length - 1]!
    ctx.fillStyle = opts.labelColor ?? opts.strokeStyle ?? 'rgba(244, 114, 182, 0.95)'
    ctx.font = '11px "Segoe UI", sans-serif'
    ctx.fillText(opts.label, map.sx(last[0]!) + 6, map.sy(last[1]!) - 6)
  }
  ctx.restore()
}

export function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts?: { radius?: number; fill?: string; label?: string; labelDx?: number; labelDy?: number },
): void {
  const r = opts?.radius ?? 3.5
  ctx.fillStyle = opts?.fill ?? '#a78bfa'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  if (opts?.label) {
    ctx.fillStyle = opts.fill ?? 'rgba(167, 139, 250, 0.9)'
    ctx.font = '12px "Segoe UI", sans-serif'
    ctx.fillText(opts.label, x + (opts.labelDx ?? 6), y + (opts.labelDy ?? -8))
  }
}

/** 质点到坐标轴的投影辅助线 */
export function drawProjectionGuides(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  ox: number,
  oy: number,
  opts?: { strokeStyle?: string },
): void {
  ctx.save()
  ctx.setLineDash([3, 4])
  ctx.lineWidth = 1
  ctx.strokeStyle = opts?.strokeStyle ?? 'rgba(148, 163, 184, 0.55)'
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(px, oy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(ox, py)
  ctx.stroke()
  ctx.restore()
}

export function createWorldMapper(
  world: WorldBounds,
  W: number,
  H: number,
  opts?: { isotropic?: boolean },
) {
  if (!opts?.isotropic) {
    const sx = (x: number) => ((x - world.xMin) / (world.xMax - world.xMin)) * W
    const sy = (y: number) => H - ((y - world.yMin) / (world.yMax - world.yMin)) * H
    return { sx, sy, scale: NaN }
  }
  // 等比例：保证世界圆在屏幕上仍是正圆（居中 letterbox）
  const worldW = world.xMax - world.xMin
  const worldH = world.yMax - world.yMin
  const scale = Math.min(W / worldW, H / worldH)
  const cx = (world.xMin + world.xMax) / 2
  const cy = (world.yMin + world.yMax) / 2
  const sx = (x: number) => W / 2 + (x - cx) * scale
  const sy = (y: number) => H / 2 - (y - cy) * scale
  return { sx, sy, scale }
}

export function drawArrow(
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

/** 浅网格 + x/y 轴箭头；isotropic 时 x/y 等比例（正圆不变形） */
export function drawGridAndAxes2D(
  ctx: CanvasRenderingContext2D,
  world: WorldBounds,
  W: number,
  H: number,
  opts?: { isotropic?: boolean },
) {
  const { sx, sy } = createWorldMapper(world, W, H, opts)

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)'
  ctx.lineWidth = 1
  const gx = Math.max(2, Math.round((world.xMax - world.xMin) / 10))
  const gy = Math.max(1, Math.round((world.yMax - world.yMin) / 8))
  for (let x = Math.ceil(world.xMin / gx) * gx; x <= world.xMax; x += gx) {
    ctx.beginPath()
    ctx.moveTo(sx(x), sy(world.yMin))
    ctx.lineTo(sx(x), sy(world.yMax))
    ctx.stroke()
  }
  for (let y = Math.ceil(world.yMin / gy) * gy; y <= world.yMax; y += gy) {
    ctx.beginPath()
    ctx.moveTo(sx(world.xMin), sy(y))
    ctx.lineTo(sx(world.xMax), sy(y))
    ctx.stroke()
  }

  const ox = sx(0)
  const oy = sy(0)
  drawArrow(ctx, sx(world.xMin) + 8, oy, sx(world.xMax) - 10, oy, '#f87171', 1.8)
  drawArrow(ctx, ox, sy(world.yMin) + 8, ox, sy(world.yMax) + 10, '#f87171', 1.8)
  ctx.fillStyle = 'rgba(248, 113, 113, 0.95)'
  ctx.font = '13px "Segoe UI", sans-serif'
  ctx.fillText('x', sx(world.xMax) - 18, oy - 8)
  ctx.fillText('y', ox + 8, sy(world.yMax) + 16)

  return { sx, sy, ox, oy }
}

/** 速度分解平行四边形 + vx/vy/v 箭头 */
export function drawVelocityDecomp2D(
  ctx: CanvasRenderingContext2D,
  opts: {
    px: number
    py: number
    tipVx: { x: number; y: number }
    tipVy: { x: number; y: number }
    tipV: { x: number; y: number }
    W: number
    H: number
  },
) {
  const { px, py, tipVx, tipVy, tipV, W, H } = opts
  const clampLabel = (lx: number, ly: number) => ({
    x: Math.min(W - 28, Math.max(4, lx)),
    y: Math.min(H - 4, Math.max(12, ly)),
  })

  ctx.save()
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1.25
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)'
  ctx.beginPath()
  ctx.moveTo(tipVx.x, tipVx.y)
  ctx.lineTo(tipV.x, tipV.y)
  ctx.lineTo(tipVy.x, tipVy.y)
  ctx.stroke()
  ctx.fillStyle = 'rgba(74, 222, 128, 0.06)'
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(tipVx.x, tipVx.y)
  ctx.lineTo(tipV.x, tipV.y)
  ctx.lineTo(tipVy.x, tipVy.y)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  drawArrow(ctx, px, py, tipVx.x, tipVx.y, '#60a5fa', 2)
  drawArrow(ctx, px, py, tipVy.x, tipVy.y, '#fbbf24', 2)
  drawArrow(ctx, px, py, tipV.x, tipV.y, '#4ade80', 2.5)

  const lx = clampLabel(tipVx.x + 4, tipVx.y + 12)
  const ly = clampLabel(tipVy.x + 6, tipVy.y - 4)
  const lv = clampLabel(tipV.x + 4, tipV.y - 4)
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillStyle = 'rgba(96, 165, 250, 0.95)'
  ctx.fillText('vₓ', lx.x, lx.y)
  ctx.fillStyle = 'rgba(251, 191, 36, 0.95)'
  ctx.fillText('vᵧ', ly.x, ly.y)
  ctx.fillStyle = 'rgba(74, 222, 128, 0.95)'
  ctx.fillText('v', lv.x, lv.y)
}

/** 图上参数/量名标注 */
export function drawDiagramLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { color?: string; font?: string; align?: CanvasTextAlign; baseline?: CanvasTextBaseline },
): void {
  ctx.save()
  ctx.fillStyle = opts?.color ?? 'rgba(226, 232, 240, 0.92)'
  ctx.font = opts?.font ?? '12px "Segoe UI", sans-serif'
  ctx.textAlign = opts?.align ?? 'left'
  ctx.textBaseline = opts?.baseline ?? 'middle'
  ctx.fillText(text, x, y)
  ctx.restore()
}

/** 角度弧 + 标注（屏幕坐标；0=+x，与 atan2(dy,dx) 一致；自动取劣弧） */
export function drawAngleMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startRad: number,
  endRad: number,
  label: string,
  opts?: { color?: string; labelDistance?: number },
): void {
  const color = opts?.color ?? 'rgba(251, 191, 36, 0.9)'
  let delta = endRad - startRad
  while (delta <= -Math.PI) delta += 2 * Math.PI
  while (delta > Math.PI) delta -= 2 * Math.PI
  const mid = startRad + delta / 2
  const labelDist = opts?.labelDistance ?? radius + 16
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  // delta>0：沿角度增大方向（canvas 默认顺时针）画劣弧
  ctx.arc(cx, cy, radius, startRad, startRad + delta, delta < 0)
  ctx.stroke()
  const lx = cx + Math.cos(mid) * labelDist
  const ly = cy + Math.sin(mid) * labelDist
  ctx.font = '12px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, lx, ly)
  ctx.restore()
}

/** 尺寸线（两点之间，带旁注；文字沿 offset 同侧再外移，避免压线） */
export function drawDimLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  opts?: { color?: string; offset?: number; labelGap?: number },
): void {
  const color = opts?.color ?? 'rgba(167, 139, 250, 0.9)'
  const offset = opts?.offset ?? 14
  const labelGap = opts?.labelGap ?? 12
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const ax1 = x1 + nx * offset
  const ay1 = y1 + ny * offset
  const ax2 = x2 + nx * offset
  const ay2 = y2 + ny * offset
  const side = offset === 0 ? 1 : Math.sign(offset)
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.25
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(ax1, ay1)
  ctx.lineTo(ax2, ay2)
  ctx.stroke()
  ctx.setLineDash([])
  // end ticks
  ctx.beginPath()
  ctx.moveTo(ax1 - nx * 4, ay1 - ny * 4)
  ctx.lineTo(ax1 + nx * 4, ay1 + ny * 4)
  ctx.moveTo(ax2 - nx * 4, ay2 - ny * 4)
  ctx.lineTo(ax2 + nx * 4, ay2 + ny * 4)
  ctx.stroke()
  ctx.font = '12px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(
    label,
    (ax1 + ax2) / 2 + nx * side * labelGap,
    (ay1 + ay2) / 2 + ny * side * labelGap,
  )
  ctx.restore()
}
