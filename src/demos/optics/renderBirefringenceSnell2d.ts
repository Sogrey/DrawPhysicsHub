import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function birefringenceSnellWorldBounds(): WorldBounds {
  return { xMin: -4, xMax: 4, yMin: -3, yMax: 3 }
}

export function drawBirefringenceSnellFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)

  // crystal half-plane y<0
  ctx.fillStyle = 'rgba(51, 65, 85, 0.5)'
  ctx.fillRect(sx(world.xMin), sy(0), sx(world.xMax) - sx(world.xMin), sy(world.yMin) - sy(0))
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), sy(0))
  ctx.lineTo(sx(world.xMax), sy(0))
  ctx.stroke()

  // normal
  ctx.setLineDash([5, 4])
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(2.5))
  ctx.lineTo(sx(0), sy(-2.5))
  ctx.stroke()
  ctx.setLineDash([])

  const ti = (Number(snap.values.thetaI ?? 0) * Math.PI) / 180
  const to = (Number(snap.values.thetaO ?? 0) * Math.PI) / 180
  const te = (Number(snap.values.thetaE ?? 0) * Math.PI) / 180
  const L = 2.4

  // incident from upper-left
  drawArrow(
    ctx,
    sx(-L * Math.sin(ti)),
    sy(L * Math.cos(ti)),
    sx(0),
    sy(0),
    'rgba(74,222,128,0.95)',
    2.5,
  )
  // o and e into crystal
  drawArrow(ctx, sx(0), sy(0), sx(L * Math.sin(to)), sy(-L * Math.cos(to)), 'rgba(56,189,248,0.95)', 2.5)
  drawArrow(ctx, sx(0), sy(0), sx(L * Math.sin(te)), sy(-L * Math.cos(te)), 'rgba(244,114,182,0.95)', 2.5)

  drawDiagramLabel(ctx, 'θᵢ', sx(-0.9), sy(1.2), { color: '#4ade80', font: '12px "Segoe UI", sans-serif' })
  drawDiagramLabel(ctx, 'θ_o', sx(0.9), sy(-1.0), { color: '#38bdf8', font: '12px "Segoe UI", sans-serif' })
  drawDiagramLabel(ctx, 'θ_e', sx(1.5), sy(-0.55), { color: '#f472b6', font: '12px "Segoe UI", sans-serif' })

  const dTh = Number(snap.values.dTheta ?? 0)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(500, W - 24), 48)
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)'
  ctx.strokeRect(12, 10, Math.min(500, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `双折射斯涅耳 · θᵢ=${Number(snap.values.thetaI ?? 0).toFixed(1)}°  Δθ=${dTh.toFixed(2)}°`,
    22,
    28,
    { color: 'rgba(251, 207, 232, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '绿=入射；青=o；粉=e。虚线=法线', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
