import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDashedPath,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  drawTrailPolyline,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function energyCurveWorldBounds(A: number, E: number): WorldBounds {
  const xPad = Math.max(0.4, A * 0.35)
  const yPad = Math.max(0.35, E * 0.25)
  return {
    xMin: -A - xPad,
    xMax: A + xPad,
    yMin: -yPad * 0.35,
    yMax: E + yPad,
  }
}

export function drawEnergyCurveFrame(
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

  const A = Number(snap.values.A ?? 1.5)
  const E = Number(snap.values.E ?? 1)
  const U = Number(snap.values.U ?? 0)
  const K = Number(snap.values.K ?? 0)
  const x = Number(snap.values.x ?? 0)

  // potential curve
  const pot = snap.trails?.potential ?? []
  if (pot.length > 1) {
    drawTrailPolyline(ctx, pot, map, { strokeStyle: '#fbbf24', lineWidth: 2.4 })
  }

  // total energy line
  const ePath =
    opts?.compare?.path ??
    ([
      [world.xMin, E],
      [world.xMax, E],
    ] as number[][])
  drawDashedPath(ctx, ePath, map, {
    strokeStyle: 'rgba(244, 114, 182, 0.9)',
    label: opts?.compare?.label ?? `E=${E.toFixed(2)} J`,
    dash: [6, 4],
  })

  // turning points
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1
  for (const xt of [-A, A]) {
    ctx.beginPath()
    ctx.moveTo(sx(xt), sy(0))
    ctx.lineTo(sx(xt), sy(E))
    ctx.stroke()
  }
  ctx.setLineDash([])
  drawDiagramLabel(ctx, '−A', sx(-A) - 10, sy(0) + 14, { color: 'rgba(148,163,184,0.9)' })
  drawDiagramLabel(ctx, '+A', sx(A) - 4, sy(0) + 14, { color: 'rgba(148,163,184,0.9)' })

  // kinetic energy vertical segment U → E at current x
  const px = sx(x)
  const pyU = sy(U)
  const pyE = sy(E)
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.95)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(px, pyU)
  ctx.lineTo(px, pyE)
  ctx.stroke()
  if (K > E * 0.05) {
    drawDiagramLabel(ctx, 'K', px + 6, (pyU + pyE) / 2, { color: 'rgba(74, 222, 128, 0.95)' })
  }

  // state point on U(x)
  const glow = ctx.createRadialGradient(px, pyU, 0, px, pyU, 12)
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.5)')
  glow.addColorStop(1, 'rgba(251, 191, 36, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(px, pyU, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(px, pyU, 5.5, 0, Math.PI * 2)
  ctx.fill()

  // particle on x-axis (position rail)
  const particleY = sy(0)
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(px, particleY, 6.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(px, particleY)
  ctx.lineTo(px, pyU)
  ctx.stroke()

  drawMarker(ctx, ox, oy, { radius: 2.5, fill: 'rgba(148,163,184,0.8)', label: 'O' })
  drawDimLine(ctx, sx(-A), oy, sx(A), oy, `2A=${(2 * A).toFixed(2)} m`, { offset: 18 })
  drawDiagramLabel(ctx, `U=${U.toFixed(2)} J`, sx(world.xMin) + 8, sy(world.yMax) - 8, {
    color: 'rgba(251, 191, 36, 0.95)',
  })
  drawDiagramLabel(ctx, `K=${K.toFixed(2)} J`, sx(world.xMin) + 8, sy(world.yMax) - 24, {
    color: 'rgba(74, 222, 128, 0.95)',
  })
}
