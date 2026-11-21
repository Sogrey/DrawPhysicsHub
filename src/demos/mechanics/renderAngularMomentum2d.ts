import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDashedPath,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  drawTrailPolyline,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function angularMomentumWorldBounds(b: number, xSpan: number): WorldBounds {
  const padX = 0.8
  const padY = Math.max(0.8, Math.abs(b) * 0.45)
  return {
    xMin: -xSpan - padX,
    xMax: xSpan + padX,
    yMin: Math.min(-0.6, b - padY),
    yMax: Math.max(b + padY, 0.8),
  }
}

export function drawAngularMomentumFrame(
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

  const b = Number(snap.values.b ?? 1.5)
  const xSpan = Number(snap.values.xSpan ?? 5)
  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? b)
  const vx = Number(snap.values.vx ?? 0)
  const Lz = Number(snap.values.Lz ?? 0)
  const Lmag = Number(snap.values.Lmag ?? 0)

  // velocity line (y=b) and lever arm
  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.75)',
      label: opts.compare.label,
    })
  } else {
    drawDashedPath(
      ctx,
      [
        [-xSpan - 0.5, b],
        [xSpan + 0.5, b],
      ],
      map,
      { strokeStyle: 'rgba(244, 114, 182, 0.55)', dash: [5, 4] },
    )
  }

  // lever arm from O to line y=b
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(sx(0), sy(b))
  ctx.stroke()
  ctx.setLineDash([])
  drawDimLine(ctx, ox, oy, sx(0), sy(b), `b=${Math.abs(b).toFixed(2)} m`, { offset: -14 })

  const path = snap.trails?.path ?? []
  if (path.length > 1) {
    drawTrailPolyline(ctx, path, map, { strokeStyle: '#38bdf8', lineWidth: 2.4 })
  }

  const px = sx(x)
  const py = sy(y)

  // position vector r
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.85)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(px, py)
  ctx.stroke()
  drawDiagramLabel(ctx, 'r', sx(x * 0.55), sy(y * 0.55) - 8, {
    color: 'rgba(167, 139, 250, 0.95)',
  })

  // momentum arrow
  const pScale = 0.45
  drawArrow(ctx, px, py, sx(x + vx * pScale), sy(y), '#4ade80', 2.4)
  drawDiagramLabel(ctx, 'p', sx(x + vx * pScale) + 4, sy(y) - 8, {
    color: 'rgba(74, 222, 128, 0.95)',
  })

  // particle
  const glow = ctx.createRadialGradient(px, py, 0, px, py, 13)
  glow.addColorStop(0, 'rgba(56, 189, 248, 0.45)')
  glow.addColorStop(1, 'rgba(56, 189, 248, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(px, py, 13, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(px, py, 6.5, 0, Math.PI * 2)
  ctx.fill()

  drawMarker(ctx, ox, oy, { radius: 4, fill: 'rgba(248,113,113,0.95)', label: 'O' })

  // L out-of-plane hint
  const sense = Lz <= 0 ? '⊗ L（入纸）' : '⊙ L（出纸）'
  drawDiagramLabel(ctx, sense, sx(world.xMin) + 8, sy(world.yMax) - 8, {
    color: 'rgba(167, 139, 250, 0.95)',
  })
  drawDiagramLabel(ctx, `|L|=${Lmag.toFixed(2)}`, sx(world.xMin) + 8, sy(world.yMax) - 24, {
    color: 'rgba(251, 191, 36, 0.95)',
  })
}
