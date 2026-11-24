import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function brewsterWorldBounds(): WorldBounds {
  return { xMin: -4, xMax: 4, yMin: -2.5, yMax: 3 }
}

export function drawBrewsterFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)

  ctx.fillStyle = 'rgba(51, 65, 85, 0.55)'
  ctx.fillRect(sx(world.xMin), sy(0), sx(world.xMax) - sx(world.xMin), sy(world.yMin) - sy(0))
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), sy(0))
  ctx.lineTo(sx(world.xMax), sy(0))
  ctx.stroke()

  const th = (Number(snap.values.theta ?? 0) * Math.PI) / 180
  const thB = (Number(snap.values.thetaB ?? 56) * Math.PI) / 180
  const Rs = Number(snap.values.Rs ?? 0)
  const Rp = Number(snap.values.Rp ?? 0)
  const L = 2.5

  // Brewster guide
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.7)'
  ctx.beginPath()
  ctx.moveTo(sx(-L * Math.sin(thB)), sy(L * Math.cos(thB)))
  ctx.lineTo(sx(0), sy(0))
  ctx.stroke()
  ctx.setLineDash([])
  drawDiagramLabel(ctx, 'θ_B', sx(-1.6), sy(1.6), { color: '#a78bfa', font: '12px "Segoe UI", sans-serif' })

  drawArrow(ctx, sx(-L * Math.sin(th)), sy(L * Math.cos(th)), sx(0), sy(0), 'rgba(74,222,128,0.95)', 2.5)
  // reflected s / p lengths
  const rsLen = 0.4 + 2.0 * Rs
  const rpLen = 0.4 + 2.0 * Rp
  drawArrow(
    ctx,
    sx(0),
    sy(0),
    sx(rsLen * Math.sin(th)),
    sy(rsLen * Math.cos(th)),
    'rgba(56,189,248,0.95)',
    2.5,
  )
  drawArrow(
    ctx,
    sx(0),
    sy(0),
    sx(rpLen * Math.sin(th) * 0.92),
    sy(rpLen * Math.cos(th) * 0.92),
    'rgba(244,114,182,0.85)',
    2.2,
  )

  // refracted hint
  const n1 = Number(snap.values.n1 ?? 1)
  const n2 = Number(snap.values.n2 ?? 1.5)
  const s2 = Math.min(0.999, (n1 / n2) * Math.sin(th))
  const th2 = Math.asin(s2)
  drawArrow(ctx, sx(0), sy(0), sx(2.2 * Math.sin(th2)), sy(-2.2 * Math.cos(th2)), 'rgba(148,163,184,0.7)', 2)

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(520, W - 24), 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(12, 10, Math.min(520, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `布儒斯特 · θ=${Number(snap.values.theta ?? 0).toFixed(1)}°  θ_B=${Number(snap.values.thetaB ?? 0).toFixed(1)}°  R_p=${Rp.toFixed(3)}`,
    22,
    28,
    { color: 'rgba(196, 181, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '紫虚线=θ_B；青=R_s，粉=R_p（谷点起偏）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
