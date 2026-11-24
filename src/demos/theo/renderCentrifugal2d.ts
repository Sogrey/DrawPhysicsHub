import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function centrifugalWorldBounds(world: number): WorldBounds {
  const w = Math.max(3.5, world)
  return { xMin: -w, xMax: w, yMin: -w, yMax: w }
}

export function drawCentrifugalFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const r = Number(snap.values.r ?? 0.4)
  const x = Number(snap.values.x ?? r)
  const y = Number(snap.values.y ?? 0)
  const acf = Number(snap.values.acf ?? 0)
  const Omega = Number(snap.values.Omega ?? 1)
  const Veff = Number(snap.values.Veff ?? 0)
  const phi = Number(snap.values.phi ?? 0)

  // disk
  const diskR = Math.min(world.xMax - 0.4, Math.max(2.5, r + 0.8))
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(sx(0), sy(0), sx(diskR) - sx(0), 0, Math.PI * 2)
  ctx.stroke()

  // radial slot
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.9)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(0))
  ctx.lineTo(sx(diskR * Math.cos((phi * Math.PI) / 180)), sy(diskR * Math.sin((phi * Math.PI) / 180)))
  ctx.stroke()

  drawMarker(ctx, sx(x), sy(y), { radius: 8, fill: '#fbbf24', label: 'm', labelDx: 10 })
  // a_cf outward
  const ux = x / Math.max(1e-6, r)
  const uy = y / Math.max(1e-6, r)
  const alen = Math.min(1.4, 0.25 + acf * 0.15)
  drawArrow(ctx, sx(x), sy(y), sx(x + ux * alen), sy(y + uy * alen), 'rgba(244, 114, 182, 0.95)', 2.5)
  drawDiagramLabel(ctx, 'a_cf=Ω²r', sx(x + ux * alen) + 6, sy(y + uy * alen), {
    color: '#f472b6',
    font: '11px "Segoe UI", sans-serif',
  })

  // Veff mini plot bottom
  const barX = 16
  const barY = H - 56
  const barW = Math.min(280, W - 40)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(barX, barY, barW, 40)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(barX, barY, barW, 40)
  drawDiagramLabel(ctx, `V_eff=−½Ω²r² = ${Veff.toFixed(2)}`, barX + 8, barY + 16, {
    color: '#a78bfa',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, `r=${r.toFixed(2)}  Ω=${Omega.toFixed(2)}  （外甩↑）`, barX + 8, barY + 32, {
    color: 'rgba(226,232,240,0.9)',
    font: '11px "Segoe UI", sans-serif',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 44)
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 44)
  drawDiagramLabel(ctx, `离心力 · a_cf=Ω²r=${acf.toFixed(2)} · 有效势下凹→不稳定`, 22, 28, {
    color: 'rgba(251, 207, 232, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '光滑径向槽；与科里奥利（切向弯曲）对照', 22, 44, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
