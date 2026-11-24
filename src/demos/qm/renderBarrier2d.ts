import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function barrierWorldBounds(): WorldBounds {
  return { xMin: -4.5, xMax: 4.5, yMin: -1.6, yMax: 3.2 }
}

export function drawBarrierFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: false })

  const a = Number(snap.values.a ?? 1)
  const V0 = Number(snap.values.V0 ?? 2)
  const E = Number(snap.values.E ?? 1)
  const T = Number(snap.values.T ?? 0)

  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.fillRect(sx(0), sy(V0), sx(a) - sx(0), sy(0) - sy(V0))
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), sy(0))
  ctx.lineTo(sx(0), sy(0))
  ctx.lineTo(sx(0), sy(V0))
  ctx.lineTo(sx(a), sy(V0))
  ctx.lineTo(sx(a), sy(0))
  ctx.lineTo(sx(world.xMax), sy(0))
  ctx.stroke()

  // region labels I / II / III
  drawDiagramLabel(ctx, 'I 入射+反射', sx((world.xMin + 0) / 2), sy(-1.15), {
    color: 'rgba(56, 189, 248, 0.9)',
    font: 'bold 12px "Segoe UI", sans-serif',
    align: 'center',
  })
  drawDiagramLabel(ctx, E < V0 ? 'II 隧道衰减' : 'II 振荡', sx(a / 2), sy(-1.15), {
    color: 'rgba(251, 191, 36, 0.95)',
    font: 'bold 12px "Segoe UI", sans-serif',
    align: 'center',
  })
  drawDiagramLabel(ctx, 'III 透射', sx((a + world.xMax) / 2), sy(-1.15), {
    color: 'rgba(74, 222, 128, 0.95)',
    font: 'bold 12px "Segoe UI", sans-serif',
    align: 'center',
  })

  drawDimLine(ctx, sx(0), sy(V0 + 0.15), sx(a), sy(V0 + 0.15), `垒宽 a=${a.toFixed(2)}`, {
    color: 'rgba(167, 139, 250, 0.95)',
    offset: -10,
  })
  drawDimLine(ctx, sx(a + 0.15), sy(0), sx(a + 0.15), sy(V0), `V₀=${V0.toFixed(2)}`, {
    color: 'rgba(148, 163, 184, 0.95)',
    offset: 14,
  })

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)'
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), sy(E))
  ctx.lineTo(sx(world.xMax), sy(E))
  ctx.stroke()
  ctx.setLineDash([])
  drawDiagramLabel(
    ctx,
    `E=${E.toFixed(2)} ${E < V0 ? '< V₀（隧道）' : '> V₀（可经典越过）'}`,
    sx(world.xMin) + 8,
    sy(E) - 8,
    { color: 'rgba(251, 191, 36, 0.98)', font: 'bold 12px "Segoe UI", sans-serif' },
  )

  const psi = snap.values.psi
  const nSamp = Number(snap.values.nSamp ?? 0)
  const xMin = Number(snap.values.xMin ?? -4)
  const xMax = Number(snap.values.xMax ?? 4)
  if (psi instanceof Float32Array && nSamp > 2) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    for (let i = 0; i < nSamp; i++) {
      const x = xMin + ((xMax - xMin) * i) / (nSamp - 1)
      const y = psi[i]!
      if (i === 0) ctx.moveTo(sx(x), sy(y))
      else ctx.lineTo(sx(x), sy(y))
    }
    ctx.stroke()
  }

  // inset T(E)
  const insetX = W - 210
  const insetY = 70
  const insetW = 180
  const insetH = 100
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(insetX, insetY, insetW, insetH)
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)'
  ctx.strokeRect(insetX, insetY, insetW, insetH)
  drawDiagramLabel(ctx, 'T(E)', insetX + 8, insetY + 14, {
    color: 'rgba(74, 222, 128, 0.95)',
    font: 'bold 11px "Segoe UI", sans-serif',
  })
  const curveE = snap.values.curveE
  const curveT = snap.values.curveT
  const nCurve = Number(snap.values.nCurve ?? 0)
  const eMax = Number(snap.values.eMax ?? 3)
  if (curveE instanceof Float32Array && curveT instanceof Float32Array && nCurve > 2) {
    const ix = (e: number) => insetX + 10 + (e / eMax) * (insetW - 20)
    const iy = (tt: number) => insetY + insetH - 12 - tt * (insetH - 28)
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.95)'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    for (let i = 0; i < nCurve; i++) {
      const x = ix(curveE[i]!)
      const y = iy(curveT[i]!)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.fillStyle = '#f472b6'
    ctx.beginPath()
    ctx.arc(ix(E), iy(T), 4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 240), 48)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
  ctx.strokeRect(12, 10, Math.min(480, W - 240), 48)
  drawDiagramLabel(ctx, `势垒隧道 · T=${T.toFixed(3)}  R=${Number(snap.values.R ?? 0).toFixed(3)}`, 22, 28, {
    color: 'rgba(186, 230, 253, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, `ħ=m=1 · V₀=${V0.toFixed(2)} · a=${a.toFixed(2)}`, 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
