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
  drawTrailPolyline,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function pendulumWorldBounds(L: number): WorldBounds {
  const pad = Math.max(0.4, L * 0.2)
  return {
    xMin: -L - pad,
    xMax: L + pad,
    yMin: -L - pad * 0.5,
    yMax: pad * 1.2,
  }
}

export function drawPendulumFrame(
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

  const L = Number(snap.values.L ?? 1)
  const theta0 = ((Number(snap.values.theta0 ?? 20) * Math.PI) / 180)

  // arc of max swing
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  const nArc = 40
  for (let i = 0; i <= nArc; i++) {
    const th = -theta0 + (2 * theta0 * i) / nArc
    const px = sx(L * Math.sin(th))
    const py = sy(-L * Math.cos(th))
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.setLineDash([])

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.85)',
      label: opts.compare.label,
    })
  }

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    drawTrailPolyline(ctx, path, map, { strokeStyle: '#38bdf8', lineWidth: 2 })
  }

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const px = sx(x)
  const py = sy(y)

  // pivot
  drawMarker(ctx, ox, oy, { radius: 4, fill: '#94a3b8', label: '支点' })

  // rod
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(px, py)
  ctx.stroke()

  // bob
  const glow = ctx.createRadialGradient(px, py, 0, px, py, 16)
  glow.addColorStop(0, 'rgba(249, 115, 22, 0.45)')
  glow.addColorStop(1, 'rgba(249, 115, 22, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(px, py, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f97316'
  ctx.beginPath()
  ctx.arc(px, py, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(254, 215, 170, 0.8)'
  ctx.lineWidth = 1
  ctx.stroke()

  // equilibrium
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)'
  ctx.setLineDash([3, 4])
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(sx(0), sy(-L))
  ctx.stroke()
  ctx.setLineDash([])

  const thetaDeg = Number(snap.values.theta ?? 0)
  const theta0Deg = Number(snap.values.theta0 ?? 20)
  drawDimLine(ctx, ox, oy, sx(0), sy(-L), `L=${L.toFixed(2)} m`, { offset: -16 })
  // 当前摆角：竖直向下为 π/2 in canvas from +x... 用几何角标注
  const cur = ((Number(snap.values.theta ?? 0) * Math.PI) / 180)
  drawAngleMark(
    ctx,
    ox,
    oy,
    34,
    Math.PI / 2,
    Math.PI / 2 - cur,
    `θ=${thetaDeg.toFixed(1)}°`,
  )
  drawDiagramLabel(ctx, `θ₀=${theta0Deg.toFixed(0)}°`, sx(world.xMin) + 8, sy(world.yMax) + 18, {
    color: 'rgba(251, 191, 36, 0.95)',
  })
}
