import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function oscillatorWorldBounds(span: number): WorldBounds {
  const s = Math.max(2, span)
  return { xMin: -s, xMax: s, yMin: -1.4, yMax: 2.6 }
}

export function drawOscillatorFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: false })

  const nSamp = Number(snap.values.nSamp ?? 0)
  const span = Number(snap.values.span ?? 4)
  const pot = snap.values.pot
  const psi = snap.values.psi
  const dens = snap.values.dens
  const re = snap.values.re
  const E = Number(snap.values.E ?? 1)
  const n = Math.round(Number(snap.values.n ?? 0))

  if (pot instanceof Float32Array && nSamp > 2) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.85)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < nSamp; i++) {
      const x = -span + (2 * span * i) / (nSamp - 1)
      const y = Math.min(world.yMax - 0.1, pot[i]!)
      if (i === 0) ctx.moveTo(sx(x), sy(y))
      else ctx.lineTo(sx(x), sy(y))
    }
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)'
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), sy(E))
  ctx.lineTo(sx(world.xMax), sy(E))
  ctx.stroke()
  ctx.setLineDash([])
  drawDiagramLabel(ctx, `Eₙ=${E.toFixed(3)}`, sx(world.xMin) + 8, sy(E) - 8, {
    color: 'rgba(251, 191, 36, 0.98)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })

  // classical turning points: ½ ω² x² = E → |x|=√(2E)/ω
  const omega = Number(snap.values.omega ?? 1)
  const xt = Math.sqrt((2 * E) / Math.max(0.2, omega * omega))
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)'
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(sx(-xt), sy(world.yMin))
  ctx.lineTo(sx(-xt), sy(world.yMax))
  ctx.moveTo(sx(xt), sy(world.yMin))
  ctx.lineTo(sx(xt), sy(world.yMax))
  ctx.stroke()
  ctx.setLineDash([])
  drawMarker(ctx, sx(-xt), sy(E), { radius: 4, fill: '#f87171', label: '−xₜ', labelDx: -22, labelDy: -8 })
  drawMarker(ctx, sx(xt), sy(E), { radius: 4, fill: '#f87171', label: '+xₜ', labelDx: 8, labelDy: -8 })
  drawDimLine(ctx, sx(-xt), sy(-1.15), sx(xt), sy(-1.15), `经典区 2xₜ（E=½ω²x²）`, {
    color: 'rgba(248, 113, 113, 0.9)',
    offset: 0,
  })

  const strokeArr = (arr: Float32Array, color: string, width: number, dash?: number[]) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    if (dash) ctx.setLineDash(dash)
    ctx.beginPath()
    for (let i = 0; i < nSamp; i++) {
      const x = -span + (2 * span * i) / (nSamp - 1)
      const y = arr[i]!
      if (i === 0) ctx.moveTo(sx(x), sy(y))
      else ctx.lineTo(sx(x), sy(y))
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (dens instanceof Float32Array) strokeArr(dens, 'rgba(167, 139, 250, 0.9)', 2)
  if (psi instanceof Float32Array) strokeArr(psi, 'rgba(56, 189, 248, 0.85)', 1.6, [4, 3])
  if (re instanceof Float32Array) strokeArr(re, 'rgba(251, 191, 36, 0.95)', 2.2)

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(520, W - 24), 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(12, 10, Math.min(520, W - 24), 48)
  drawDiagramLabel(ctx, `谐振子 n=${n} · 节点数=${n} · E=ω(n+½)=${E.toFixed(3)}`, 22, 28, {
    color: 'rgba(196, 181, 253, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '青虚=ψₙ  紫=|ψ|²  金=Reψ(t)  灰=V  红虚线=经典转折点 ±xₜ', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
