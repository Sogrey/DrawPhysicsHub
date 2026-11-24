import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import { drawDiagramLabel, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'

export function drawMaxwellFrame(host: Canvas2DHost, snap: ObserveSnapshot): void {
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

  const vMax = Number(snap.values.vMaxPlot ?? 6)
  const fMax = Number(snap.values.fMax ?? 0.5) * 1.15
  const sx = (v: number) => padL + (v / vMax) * plotW
  const sy = (f: number) => padT + plotH - (f / fMax) * plotH

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
  drawDiagramLabel(ctx, 'v', padL + plotW - 10, padT + plotH + 18, {
    color: 'rgba(248, 113, 113, 0.95)',
  })
  drawDiagramLabel(ctx, 'f(v)', padL - 28, padT + 10, {
    color: 'rgba(248, 113, 113, 0.95)',
  })

  const nBins = Number(snap.values.nBins ?? 40)
  const hist = snap.values.hist
  if (hist instanceof Float32Array) {
    const bw = plotW / nBins
    ctx.fillStyle = 'rgba(100, 116, 139, 0.55)'
    for (let i = 0; i < nBins; i++) {
      const h = hist[i] ?? 0
      const y = sy(h)
      ctx.fillRect(padL + i * bw + 1, y, Math.max(1, bw - 2), padT + plotH - y)
    }
  }

  const curveV = snap.values.curveV
  const curveF = snap.values.curveF
  const nCurve = Number(snap.values.nCurve ?? 0)
  if (curveV instanceof Float32Array && curveF instanceof Float32Array && nCurve > 1) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.98)'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let i = 0; i < nCurve; i++) {
      const x = sx(curveV[i]!)
      const y = sy(curveF[i]!)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const mark = (v: number, color: string, label: string) => {
    const x = sx(v)
    ctx.strokeStyle = color
    ctx.lineWidth = 1.8
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(x, padT)
    ctx.lineTo(x, padT + plotH)
    ctx.stroke()
    ctx.setLineDash([])
    drawDiagramLabel(ctx, label, x + 4, padT + 16, { color, font: 'bold 11px "Segoe UI", sans-serif' })
  }
  const vp = Number(snap.values.vp ?? 0)
  const vavg = Number(snap.values.vavg ?? 0)
  const vrms = Number(snap.values.vrms ?? 0)
  mark(vp, 'rgba(244, 114, 182, 0.95)', 'vp')
  mark(vavg, 'rgba(56, 189, 248, 0.95)', '⟨v⟩')
  mark(vrms, 'rgba(74, 222, 128, 0.95)', 'vrms')

  // peak marker on analytical curve
  if (curveV instanceof Float32Array && curveF instanceof Float32Array && nCurve > 2) {
    let iPeak = 0
    for (let i = 1; i < nCurve; i++) if (curveF[i]! > curveF[iPeak]!) iPeak = i
    drawMarker(ctx, sx(curveV[iPeak]!), sy(curveF[iPeak]!), {
      radius: 5,
      fill: '#f472b6',
      label: `峰≈vp=${vp.toFixed(2)}`,
      labelDx: 8,
      labelDy: -10,
    })
  }

  // order brace under axis: vp < vavg < vrms
  const yOrd = padT + plotH + 28
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx(vp), yOrd)
  ctx.lineTo(sx(vrms), yOrd)
  ctx.stroke()
  drawDiagramLabel(ctx, 'vp < ⟨v⟩ < vrms', (sx(vp) + sx(vrms)) / 2, yOrd + 12, {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '11px "Segoe UI", sans-serif',
    align: 'center',
  })

  // tick labels on v axis
  for (const vv of [vp, vavg, vrms]) {
    drawDiagramLabel(ctx, vv.toFixed(2), sx(vv), padT + plotH + 14, {
      color: 'rgba(148, 163, 184, 0.9)',
      font: '10px "Segoe UI", sans-serif',
      align: 'center',
    })
  }

  const T = Number(snap.values.T ?? 1)
  const total = Number(snap.values.total ?? 0)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(560, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
  ctx.strokeRect(12, 10, Math.min(560, W - 24), 48)
  drawDiagramLabel(ctx, `麦克斯韦 f(v) · T=${T.toFixed(2)} · m=k=1 · 升高 T → 峰右移变矮`, 22, 28, {
    color: 'rgba(253, 230, 138, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `样本 N=${Math.round(total)}  金线=解析  灰柱=抽样  粉/青/绿竖线=vp/⟨v⟩/vrms`,
    22,
    46,
    { color: 'rgba(226, 232, 240, 0.88)', font: '11px "Segoe UI", sans-serif' },
  )
}
