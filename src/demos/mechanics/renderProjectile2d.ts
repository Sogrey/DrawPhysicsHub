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
  drawProjectionGuides,
  drawTrailPolyline,
  drawVelocityDecomp2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export type { CompareTrail }

export interface ProjectileDrawOptions {
  showDecomp?: boolean
  compare?: CompareTrail | null
  velocityScale?: number
}

export const VELOCITY_ARROW_SCALE = 0.4

/** 抛体专用 2D 画面 */
export function drawProjectileFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
  opts?: ProjectileDrawOptions,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const { sx, sy, ox, oy } = drawGridAndAxes2D(ctx, world, W, H)
  const map = { sx, sy }

  const v0 = Number(snap.values.v0 ?? 20)
  const angle = Number(snap.values.angle ?? 45)
  const th = (angle * Math.PI) / 180
  const range = Number(snap.values.range ?? 0)
  const hmax = Number(snap.values.hmax ?? 0)
  const tmax = Number(snap.values.tmax ?? 0)
  const G = 9.8

  const compare = opts?.compare
  if (compare?.path) {
    drawDashedPath(ctx, compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.85)',
      label: compare.label,
    })
  }

  if (range > 0) {
    const T = (2 * v0 * Math.sin(th)) / G
    const theory: number[][] = []
    const n = 64
    for (let i = 0; i <= n; i++) {
      const tt = (T * i) / n
      theory.push([
        v0 * Math.cos(th) * tt,
        Math.max(0, v0 * Math.sin(th) * tt - 0.5 * G * tt * tt),
      ])
    }
    drawDashedPath(ctx, theory, map, {
      strokeStyle: 'rgba(249, 115, 22, 0.55)',
      lineWidth: 1.5,
      dash: [6, 5],
    })

    drawMarker(ctx, sx(range), sy(0), {
      radius: 4,
      fill: '#a78bfa',
      label: `R=${range.toFixed(1)}`,
    })

    if (tmax > 0) {
      const ax = v0 * Math.cos(th) * tmax
      drawMarker(ctx, sx(ax), sy(hmax), {
        radius: 3.5,
        fill: 'rgba(251, 191, 36, 0.85)',
        label: `H=${hmax.toFixed(1)}`,
      })
    }
  }

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    const grad = ctx.createLinearGradient(sx(path[0]![0]!), 0, sx(path[path.length - 1]![0]!), 0)
    grad.addColorStop(0, '#38bdf8')
    grad.addColorStop(1, '#22d3ee')
    drawTrailPolyline(ctx, path, map, { strokeStyle: grad, lineWidth: 2.5 })
  }

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const px = sx(x)
  const py = sy(y)

  if (x > 0.02 || y > 0.05) {
    if (y > 0.05) drawProjectionGuides(ctx, px, py, ox, oy)

    if (x > 0.02) {
      drawMarker(ctx, px, oy, { radius: 2.5, fill: 'rgba(148, 163, 184, 0.9)' })
      ctx.font = '10px ui-monospace, Consolas, monospace'
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
      ctx.fillText(`x=${x.toFixed(1)}`, Math.min(W - 64, Math.max(4, px + 4)), oy - 6)
    }
    if (y > 0.15) {
      drawMarker(ctx, ox, py, { radius: 2.5, fill: 'rgba(148, 163, 184, 0.9)' })
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
      ctx.fillText(`y=${y.toFixed(1)}`, Math.max(4, ox - 36), py - 4)
    }
  }

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
  const scale = opts?.velocityScale ?? VELOCITY_ARROW_SCALE

  if (opts?.showDecomp !== false) {
    drawVelocityDecomp2D(ctx, {
      px,
      py,
      tipVx: { x: sx(x + vx * scale), y: sy(y) },
      tipVy: { x: sx(x), y: sy(y + vy * scale) },
      tipV: { x: sx(x + vx * scale), y: sy(y + vy * scale) },
      W,
      H,
    })
  }

  const lcX = Math.min(W - 80, Math.max(4, px + 10))
  const lcY = Math.min(H - 4, Math.max(12, py - 10))
  ctx.fillStyle = 'rgba(226, 232, 240, 0.75)'
  ctx.font = '12px ui-monospace, Consolas, monospace'
  ctx.fillText(`(${x.toFixed(2)}, ${y.toFixed(2)})`, lcX, lcY)

  // 参数标注
  drawAngleMark(ctx, ox, oy, 36, -th, 0, `θ=${angle.toFixed(0)}°`)
  drawDiagramLabel(ctx, `v₀=${v0.toFixed(1)} m/s`, ox + 42, oy - 28, {
    color: 'rgba(74, 222, 128, 0.95)',
  })
  if (range > 1) {
    drawDimLine(ctx, ox, oy, sx(range), oy, `R=${range.toFixed(1)} m`, { offset: 16 })
  }
  if (hmax > 0.5 && tmax > 0) {
    const ax = v0 * Math.cos(th) * tmax
    drawDimLine(ctx, sx(ax), oy, sx(ax), sy(hmax), `H=${hmax.toFixed(1)} m`, {
      offset: 12,
      color: 'rgba(251, 191, 36, 0.9)',
    })
  }
}

export function projectileWorldBounds(live: Record<string, number>, v0: number): WorldBounds {
  const range = Math.max(10, Number(live.range || 10) * 1.15, (v0 * v0) / 9.8)
  const arrowPad = v0 * VELOCITY_ARROW_SCALE * 1.25
  return {
    xMin: -Math.max(2, arrowPad * 0.35),
    xMax: range * 1.08 + arrowPad,
    yMin: -arrowPad,
    yMax: Math.max(8, Number(live.hmax) * 1.45 + 4),
  }
}
