import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  drawTrailPolyline,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function forcedWorldBounds(Ass: number): WorldBounds {
  const A = Math.max(0.6, Ass)
  const pad = Math.max(0.5, A * 0.3)
  return {
    xMin: -A - pad,
    xMax: A + pad,
    yMin: -pad * 0.7,
    yMax: pad * 1.35,
  }
}

export function drawForcedFrame(
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

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), oy)
  ctx.lineTo(sx(world.xMax), oy)
  ctx.stroke()
  ctx.setLineDash([])

  const compare = opts?.compare
  if (compare?.path?.length) {
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.85)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 2
    ctx.beginPath()
    const p0 = compare.path[0]!
    ctx.moveTo(sx(p0[0]!), sy(0))
    for (let i = 1; i < compare.path.length; i++) {
      ctx.lineTo(sx(compare.path[i]![0]!), sy(0))
    }
    ctx.stroke()
    ctx.setLineDash([])
    if (compare.label) {
      const last = compare.path[compare.path.length - 1]!
      ctx.fillStyle = 'rgba(244, 114, 182, 0.95)'
      ctx.font = '11px "Segoe UI", sans-serif'
      ctx.fillText(compare.label, sx(last[0]!) + 6, oy - 8)
    }
  }

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    drawTrailPolyline(ctx, path, map, { strokeStyle: '#38bdf8', lineWidth: 2 })
  }

  const x = Number(snap.values.x ?? 0)
  const px = sx(x)
  const py = sy(0)

  // 左壁 + 驱动示意（小活塞随 F(t) 微移）
  const wallBase = world.xMin + 0.12
  const drive = Number(snap.values.drive ?? 0)
  const F0 = Math.max(1e-6, Number(snap.values.F0 ?? 1))
  const driveShift = (drive / F0) * 0.12
  const wallX = sx(wallBase + driveShift)

  ctx.fillStyle = 'rgba(71, 85, 105, 0.85)'
  ctx.fillRect(sx(world.xMin), py - 22, Math.max(6, wallX - sx(world.xMin) + 2), 44)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(wallX, py - 18)
  ctx.lineTo(wallX, py + 18)
  ctx.stroke()

  // 弹簧
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(wallX, py)
  const segs = 10
  for (let i = 1; i <= segs; i++) {
    const tt = i / segs
    const xi = wallX + (px - wallX) * tt
    const yi = py + (i % 2 === 0 ? -8 : 8) * (i === segs ? 0 : 1)
    ctx.lineTo(xi, yi)
  }
  ctx.lineTo(px, py)
  ctx.stroke()

  drawMarker(ctx, ox, oy, { radius: 2.5, fill: 'rgba(148,163,184,0.8)', label: 'O' })

  const glow = ctx.createRadialGradient(px, py, 0, px, py, 14)
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.4)')
  glow.addColorStop(1, 'rgba(56, 189, 248, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(px, py, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(px, py, 7, 0, Math.PI * 2)
  ctx.fill()

  const vx = Number(snap.values.vx ?? 0)
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(sx(x + vx * 0.1), py)
  ctx.stroke()

  // —— 参数标注 ——
  const Ass = Number(snap.values.Ass ?? snap.values.A ?? 1)
  const omega0 = Number(snap.values.omega0 ?? 0)
  const omega = Number(snap.values.omega ?? 0)
  const gamma = Number(snap.values.gamma ?? 0)
  const delta = Number(snap.values.delta ?? 0)

  drawDimLine(ctx, sx(-Ass), oy - 12, sx(Ass), oy - 12, `A=${Ass.toFixed(2)} m`, {
    offset: -8,
    labelGap: 12,
  })
  drawDiagramLabel(ctx, `x=${x.toFixed(2)} m`, px + 10, py - 18)
  drawDiagramLabel(ctx, `ω₀=${omega0.toFixed(2)}`, sx(world.xMin) + 10, sy(world.yMax) + 14, {
    color: 'rgba(96, 165, 250, 0.95)',
  })
  drawDiagramLabel(ctx, `ω=${omega.toFixed(2)}`, sx(world.xMin) + 10, sy(world.yMax) + 30, {
    color: 'rgba(251, 191, 36, 0.95)',
  })
  drawDiagramLabel(ctx, `γ=${gamma.toFixed(2)}`, sx(world.xMin) + 10, sy(world.yMax) + 46, {
    color: 'rgba(167, 139, 250, 0.95)',
  })
  drawDiagramLabel(ctx, `δ=${delta.toFixed(0)}°`, sx(world.xMax) - 8, sy(world.yMax) + 14, {
    color: 'rgba(251, 191, 36, 0.95)',
    align: 'right',
  })
  drawDiagramLabel(ctx, `F₀=${F0.toFixed(1)} N`, wallX + 6, py + 28, {
    color: 'rgba(251, 191, 36, 0.85)',
    font: '11px "Segoe UI", sans-serif',
  })
}
