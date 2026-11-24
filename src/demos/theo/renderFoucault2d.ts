import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function foucaultWorldBounds(world: number): WorldBounds {
  const w = Math.max(2.5, world)
  return { xMin: -w, xMax: w, yMin: -w, yMax: w }
}

export function drawFoucaultFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const alpha = (Number(snap.values.alphaDeg ?? 0) * Math.PI) / 180
  const L = Number(snap.values.L ?? 2)
  const OmF = Number(snap.values.OmF ?? 0)
  const lat = Number(snap.values.lat ?? 45)

  // floor circle
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)'
  ctx.beginPath()
  ctx.arc(sx(0), sy(0), sx(L * 0.55) - sx(0), 0, Math.PI * 2)
  ctx.stroke()

  // swing plane
  const plen = L * 0.7
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.85)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(sx(-plen * Math.cos(alpha)), sy(-plen * Math.sin(alpha)))
  ctx.lineTo(sx(plen * Math.cos(alpha)), sy(plen * Math.sin(alpha)))
  ctx.stroke()
  ctx.setLineDash([])
  drawDiagramLabel(ctx, '摆平面', sx(plen * Math.cos(alpha)) + 4, sy(plen * Math.sin(alpha)), {
    color: '#a78bfa',
    font: '11px "Segoe UI", sans-serif',
  })

  const path = snap.trails?.path
  if (path && path.length > 1) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
  }

  // bob projection
  drawMarker(ctx, sx(x), sy(y), { radius: 7, fill: '#38bdf8', label: '摆球(投影)', labelDx: 10 })
  drawMarker(ctx, sx(0), sy(0), { radius: 3, fill: '#94a3b8', label: '' })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(520, W - 24), 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(12, 10, Math.min(520, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `傅科摆 · λ=${lat.toFixed(0)}°  Ω_f=${OmF.toFixed(3)}  α=${Number(snap.values.alphaDeg ?? 0).toFixed(1)}°`,
    22,
    28,
    { color: 'rgba(196, 181, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, 'Ω_f=Ω sinλ（Ω 已教学放大）；黄线=地面轨迹', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
