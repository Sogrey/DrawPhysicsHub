import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function idealGasWorldBounds(): WorldBounds {
  return { xMin: -3.8, xMax: 4.2, yMin: -3, yMax: 3.2 }
}

export function drawIdealGasFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const side = Number(snap.values.side ?? 1.4)
  const P = Number(snap.values.P ?? 1)
  const T = Number(snap.values.T ?? 2)
  const n = Number(snap.values.n ?? 1)
  const V = Number(snap.values.V ?? 2)
  const wallPulse = Number(snap.values.wallPulse ?? 0.5)
  const half = side / 2
  const t = Number(snap.time ?? 0)

  // gas fill
  ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + Math.min(0.35, T * 0.08)})`
  ctx.fillRect(sx(-half), sy(half), sx(half) - sx(-half), sy(-half) - sy(half))

  // pulsing wall glow ∝ P
  ctx.strokeStyle = `rgba(244, 114, 182, ${0.25 + 0.55 * wallPulse * Math.min(1.2, P / 2)})`
  ctx.lineWidth = 8
  ctx.strokeRect(sx(-half), sy(half), sx(half) - sx(-half), sy(-half) - sy(half))

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.98)'
  ctx.lineWidth = 3
  ctx.strokeRect(sx(-half), sy(half), sx(half) - sx(-half), sy(-half) - sy(half))

  // molecule dots from model (time-evolving)
  const px = snap.values.px
  const py = snap.values.py
  const nDots = Number(snap.values.nDots ?? 0)
  if (px instanceof Float32Array && py instanceof Float32Array) {
    for (let i = 0; i < nDots; i++) {
      const r = 2.2 + T * 0.45
      ctx.fillStyle = 'rgba(251, 191, 36, 0.95)'
      ctx.beginPath()
      ctx.arc(sx(px[i]!), sy(py[i]!), r, 0, Math.PI * 2)
      ctx.fill()
      // short velocity streak
      const ang = (i * 2.399 + t * (0.8 + Math.sqrt(T))) % (Math.PI * 2)
      const streak = 0.08 + 0.06 * Math.sqrt(T)
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.55)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(sx(px[i]!), sy(py[i]!))
      ctx.lineTo(sx(px[i]! + Math.cos(ang) * streak), sy(py[i]! + Math.sin(ang) * streak))
      ctx.stroke()
    }
  }

  // pressure arrows (outward on right wall)
  const nArrows = Math.min(7, Math.max(2, Math.round(1 + P * 2.2)))
  const arrowLen = 0.25 + P * 0.22
  for (let i = 0; i < nArrows; i++) {
    const y = -half + ((i + 0.5) * side) / nArrows
    const pulse = 1 + 0.12 * Math.sin(t * 8 + i) * wallPulse
    drawArrow(
      ctx,
      sx(half),
      sy(y),
      sx(half + arrowLen * pulse),
      sy(y),
      `rgba(244, 114, 182, ${0.55 + 0.4 * wallPulse})`,
      2.2,
    )
  }
  drawDiagramLabel(ctx, `P（壁面冲量∝碰撞）`, sx(half + arrowLen) + 6, sy(0), {
    color: 'rgba(244, 114, 182, 0.95)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })

  drawDimLine(ctx, sx(-half), sy(-half), sx(half), sy(-half), `√V≈${side.toFixed(2)}`, {
    color: 'rgba(167, 139, 250, 0.95)',
    offset: 22,
  })
  drawDimLine(ctx, sx(-half), sy(-half), sx(-half), sy(half), `V=${V.toFixed(2)}`, {
    color: 'rgba(56, 189, 248, 0.9)',
    offset: -22,
  })

  drawMarker(ctx, sx(0), sy(0), { radius: 3, fill: '#94a3b8', label: '' })
  drawDiagramLabel(ctx, `T=${T.toFixed(2)} → 分子速率∝√T（播放可见）`, sx(-half) + 8, sy(half) - 14, {
    color: 'rgba(253, 230, 138, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, `调 V↓ → 框缩小、P↑；调 T↑ → 更快、P↑`, sx(-half) + 8, sy(-half) + 18, {
    color: 'rgba(148, 163, 184, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // balance strip: PV vs nRT
  const PV = Number(snap.values.PV ?? 0)
  const nRT = Number(snap.values.nRT ?? 0)
  const barX = 12
  const barY = H - 52
  const barW = Math.min(420, W - 40)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(barX, barY, barW, 36)
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)'
  ctx.strokeRect(barX, barY, barW, 36)
  const maxV = Math.max(PV, nRT, 0.1)
  ctx.fillStyle = 'rgba(56, 189, 248, 0.85)'
  ctx.fillRect(barX + 70, barY + 8, (barW - 90) * (PV / maxV), 8)
  ctx.fillStyle = 'rgba(251, 191, 36, 0.85)'
  ctx.fillRect(barX + 70, barY + 20, (barW - 90) * (nRT / maxV), 8)
  drawDiagramLabel(ctx, 'PV', barX + 8, barY + 12, { color: '#38bdf8', font: '11px "Segoe UI", sans-serif' })
  drawDiagramLabel(ctx, 'nRT', barX + 8, barY + 24, { color: '#fbbf24', font: '11px "Segoe UI", sans-serif' })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(560, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
  ctx.strokeRect(12, 10, Math.min(560, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `理想气体 · P=${P.toFixed(3)}  V=${V.toFixed(2)}  T=${T.toFixed(2)}  n=${n.toFixed(2)}`,
    22,
    28,
    { color: 'rgba(253, 230, 138, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(
    ctx,
    `对照：青条=PV  金条=nRT  残差=${Number(snap.values.residual ?? 0).toExponential(2)}（应≈0）· 播放=分子运动`,
    22,
    46,
    { color: 'rgba(226, 232, 240, 0.88)', font: '11px "Segoe UI", sans-serif' },
  )
}
