import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import { drawDiagramLabel, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'

export function drawBlackbodyFrame(host: Canvas2DHost, snap: ObserveSnapshot): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const padL = 64
  const padR = 28
  const padT = 72
  const padB = 48
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const lMax = Number(snap.values.lMaxPlot ?? 3.5)
  const uMax = Number(snap.values.uMax ?? 1) * 1.12
  const sx = (L: number) => padL + (L / lMax) * plotW
  const sy = (u: number) => padT + plotH - (u / uMax) * plotH

  ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const x = padL + (plotW * i) / 5
    const y = padT + (plotH * i) / 5
    ctx.beginPath()
    ctx.moveTo(x, padT)
    ctx.lineTo(x, padT + plotH)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(padL, y)
    ctx.lineTo(padL + plotW, y)
    ctx.stroke()
  }
  ctx.strokeStyle = '#f87171'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(padL, padT)
  ctx.lineTo(padL, padT + plotH)
  ctx.lineTo(padL + plotW, padT + plotH)
  ctx.stroke()
  drawDiagramLabel(ctx, 'λ', padL + plotW - 12, padT + plotH + 18, {
    color: 'rgba(248, 113, 113, 0.95)',
  })
  drawDiagramLabel(ctx, 'u', padL - 18, padT + 10, { color: 'rgba(248, 113, 113, 0.95)' })

  const curveL = snap.values.curveL
  const curveU = snap.values.curveU
  const nSamp = Number(snap.values.nSamp ?? 0)
  const reveal = Math.min(nSamp, Number(snap.values.reveal ?? nSamp))
  if (curveL instanceof Float32Array && curveU instanceof Float32Array && reveal > 1) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.98)'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let i = 0; i < reveal; i++) {
      const x = sx(curveL[i]!)
      const y = sy(curveU[i]!)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const lamMax = Number(snap.values.lamMax ?? 1)
  const T = Number(snap.values.T ?? 1)
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.95)'
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(sx(lamMax), padT)
  ctx.lineTo(sx(lamMax), padT + plotH)
  ctx.stroke()
  ctx.setLineDash([])

  // peak marker
  if (curveL instanceof Float32Array && curveU instanceof Float32Array && reveal > 2) {
    let iPeak = 0
    for (let i = 1; i < reveal; i++) if (curveU[i]! > curveU[iPeak]!) iPeak = i
    drawMarker(ctx, sx(curveL[iPeak]!), sy(curveU[iPeak]!), {
      radius: 5,
      fill: '#f472b6',
      label: `λmax=${lamMax.toFixed(2)}`,
      labelDx: 8,
      labelDy: -10,
    })
  }

  // ghost cooler curve for Wien shift comparison
  const T2 = Math.max(0.5, T * 0.65)
  if (curveL instanceof Float32Array) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
    ctx.setLineDash([4, 3])
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < nSamp; i++) {
      const L = curveL[i]!
      const x = 1 / (L * T2)
      const u = x > 40 ? 0 : (2 / L ** 5) / (Math.exp(x) - 1)
      const X = sx(L)
      const Y = sy(u)
      if (i === 0) ctx.moveTo(X, Y)
      else ctx.lineTo(X, Y)
    }
    ctx.stroke()
    ctx.setLineDash([])
    drawDiagramLabel(ctx, `对照 T'=${T2.toFixed(2)}（更冷→峰更右）`, padL + 8, padT + plotH - 12, {
      color: 'rgba(148, 163, 184, 0.95)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  drawDiagramLabel(ctx, 'λ', padL + plotW - 12, padT + plotH + 18, {
    color: 'rgba(248, 113, 113, 0.95)',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(580, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
  ctx.strokeRect(12, 10, Math.min(580, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `黑体 · T=${T.toFixed(2)}  λmax=${lamMax.toFixed(3)}  λT=${Number(snap.values.lamT ?? 0).toFixed(3)}（维恩≈常数）`,
    22,
    28,
    { color: 'rgba(253, 230, 138, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '金线=当前 T；灰虚线=更低 T 对照；粉竖线/点=峰值（升温左移）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
