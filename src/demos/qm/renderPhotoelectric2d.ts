import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import { drawArrow, drawDiagramLabel, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'

export function drawPhotoelectricFrame(host: Canvas2DHost, snap: ObserveSnapshot): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const midY = H * 0.52
  const above = Number(snap.values.above ?? 0)
  const f = Number(snap.values.f ?? 0)
  const f0 = Number(snap.values.f0 ?? 0)
  const Kmax = Number(snap.values.Kmax ?? 0)
  const Wf = Number(snap.values.W ?? 1.5)
  const I = Number(snap.values.I ?? 0.6)
  const t = Number(snap.time ?? 0)
  const period = Number(snap.values.period ?? 8)
  const progress = t / period

  // cathode / anode plates
  ctx.fillStyle = 'rgba(100, 116, 139, 0.95)'
  ctx.fillRect(W * 0.2, midY - 75, 20, 150)
  ctx.fillRect(W * 0.58, midY - 75, 20, 150)
  drawDiagramLabel(ctx, '阴极（金属）', W * 0.14, midY + 95, { color: 'rgba(226,232,240,0.95)' })
  drawDiagramLabel(ctx, '阳极（收集）', W * 0.54, midY + 95, { color: 'rgba(226,232,240,0.95)' })

  // photon packets flying toward cathode
  const nRays = Math.min(7, Math.max(3, Math.round(3 + I * 4)))
  const rayColor = above ? 'rgba(56, 189, 248, 0.95)' : 'rgba(148, 163, 184, 0.55)'
  for (let i = 0; i < nRays; i++) {
    const y = midY - 55 + i * (110 / nRays)
    const u = (progress * 1.4 + i * 0.13) % 1
    const x0 = 24 + u * (W * 0.2 - 40)
    // wavy short photon
    ctx.strokeStyle = rayColor
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let k = 0; k <= 12; k++) {
      const tt = k / 12
      const px = x0 + tt * 36
      const py = y - 18 + tt * 18 + Math.sin(tt * Math.PI * 4 + t * 8) * 3
      if (k === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    drawArrow(ctx, x0 + 30, y - 4, W * 0.2, y + 4, rayColor, 1.8)
  }
  drawDiagramLabel(ctx, above ? `光子 hf=${f.toFixed(2)} > W → 打出电子` : `光子 hf=${f.toFixed(2)} ≤ W → 打不出`, 28, midY - 88, {
    color: above ? 'rgba(74, 222, 128, 0.98)' : 'rgba(248, 113, 113, 0.98)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })

  // ========== 能量账本（核心：把含糊变成对比条） ==========
  const budX = W * 0.72
  const budY = midY - 90
  const budW = Math.min(200, W * 0.24)
  const budH = 150
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)'
  ctx.fillRect(budX, budY, budW, budH)
  ctx.strokeStyle = above ? 'rgba(74, 222, 128, 0.55)' : 'rgba(248, 113, 113, 0.55)'
  ctx.strokeRect(budX, budY, budW, budH)
  drawDiagramLabel(ctx, '能量账本 (h=1)', budX + 10, budY + 18, {
    color: 'rgba(226, 232, 240, 0.98)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })

  const maxE = Math.max(f, Wf, f0, 1) * 1.15
  const barLeft = budX + 55
  const barMaxW = budW - 70
  const row = (label: string, val: number, color: string, y: number) => {
    drawDiagramLabel(ctx, label, budX + 8, y + 4, { color, font: '11px "Segoe UI", sans-serif' })
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
    ctx.fillRect(barLeft, y - 6, barMaxW, 12)
    ctx.fillStyle = color
    ctx.fillRect(barLeft, y - 6, barMaxW * Math.min(1, val / maxE), 12)
    drawDiagramLabel(ctx, val.toFixed(2), barLeft + barMaxW + 4, y + 4, {
      color,
      font: '10px "Segoe UI", sans-serif',
    })
  }
  row('hf', f, '#38bdf8', budY + 42)
  row('W', Wf, '#a78bfa', budY + 68)
  row('Kmax', Kmax, '#fbbf24', budY + 94)
  drawDiagramLabel(
    ctx,
    above ? `hf = W + Kmax ✓` : `hf < W · 不够逸出`,
    budX + 10,
    budY + 126,
    {
      color: above ? 'rgba(74, 222, 128, 0.95)' : 'rgba(248, 113, 113, 0.95)',
      font: 'bold 11px "Segoe UI", sans-serif',
    },
  )
  drawDiagramLabel(ctx, `光强 I=${I.toFixed(2)} 只改电子数`, budX + 10, budY + 142, {
    color: 'rgba(148, 163, 184, 0.95)',
    font: '10px "Segoe UI", sans-serif',
  })

  // energy ladder near cathode
  const ladderX = W * 0.32
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(ladderX, midY + 55)
  ctx.lineTo(ladderX, midY - 70)
  ctx.stroke()
  const y0 = midY + 55
  const scale = 45
  drawMarker(ctx, ladderX, y0, { radius: 3, fill: '#94a3b8', label: '束缚 0', labelDx: 10 })
  drawMarker(ctx, ladderX, y0 - Wf * scale, { radius: 4, fill: '#a78bfa', label: `逸出功 W=${Wf.toFixed(1)}`, labelDx: 10 })
  // hf arrow
  drawArrow(ctx, ladderX - 28, y0, ladderX - 28, y0 - f * scale, 'rgba(56, 189, 248, 0.95)', 2.5)
  drawDiagramLabel(ctx, `hf`, ladderX - 48, y0 - (f * scale) / 2, {
    color: 'rgba(56, 189, 248, 0.95)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })
  if (above) {
    drawMarker(ctx, ladderX, y0 - Wf * scale - Kmax * scale, {
      radius: 5,
      fill: '#fbbf24',
      label: `Kmax=${Kmax.toFixed(2)}`,
      labelDx: 10,
      labelDy: -2,
    })
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)'
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(ladderX, y0 - Wf * scale)
    ctx.lineTo(ladderX, y0 - Wf * scale - Kmax * scale)
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    drawDiagramLabel(ctx, '未到逸出阈值', ladderX + 12, y0 - f * scale - 8, {
      color: 'rgba(248, 113, 113, 0.95)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  // electrons
  const ex = snap.values.ex
  const ey = snap.values.ey
  const nElec = Number(snap.values.nElec ?? 0)
  if (ex instanceof Float32Array && ey instanceof Float32Array) {
    const x0e = W * 0.24
    const y0e = midY
    const scaleX = W * 0.1
    const scaleY = 48
    for (let i = 0; i < nElec; i++) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.95)'
      ctx.beginPath()
      ctx.arc(x0e + ex[i]! * scaleX, y0e - ey[i]! * scaleY, 4.5, 0, Math.PI * 2)
      ctx.fill()
      drawDiagramLabel(ctx, 'e⁻', x0e + ex[i]! * scaleX + 6, y0e - ey[i]! * scaleY - 4, {
        color: 'rgba(253, 230, 138, 0.85)',
        font: '10px "Segoe UI", sans-serif',
      })
    }
  } else if (!above) {
    drawDiagramLabel(ctx, '（无光电子）', W * 0.36, midY, {
      color: 'rgba(148, 163, 184, 0.85)',
      font: '12px "Segoe UI", sans-serif',
    })
  }

  // K-f inset
  const insetX = 16
  const insetY = H - 168
  const insetW = 210
  const insetH = 140
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)'
  ctx.fillRect(insetX, insetY, insetW, insetH)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.strokeRect(insetX, insetY, insetW, insetH)
  drawDiagramLabel(ctx, 'Kmax–f 直线', insetX + 8, insetY + 16, {
    color: 'rgba(196, 181, 253, 0.98)',
    font: 'bold 11px "Segoe UI", sans-serif',
  })

  const curveF = snap.values.curveF
  const curveK = snap.values.curveK
  const nCurve = Number(snap.values.nCurve ?? 0)
  const fMax = Number(snap.values.fMax ?? 4)
  const kMaxPlot = Math.max(1, fMax - Wf)
  const ix = (ff: number) => insetX + 16 + (ff / fMax) * (insetW - 32)
  const iy = (kk: number) => insetY + insetH - 20 - (kk / kMaxPlot) * (insetH - 40)
  if (curveF instanceof Float32Array && curveK instanceof Float32Array && nCurve > 2) {
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < nCurve; i++) {
      const x = ix(curveF[i]!)
      const y = iy(curveK[i]!)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.75)'
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(ix(f0), insetY + 20)
  ctx.lineTo(ix(f0), insetY + insetH - 16)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#f472b6'
  ctx.beginPath()
  ctx.arc(ix(f), iy(Kmax), 5, 0, Math.PI * 2)
  ctx.fill()
  drawDiagramLabel(ctx, `f₀=${f0.toFixed(2)}`, ix(f0) - 10, insetY + insetH - 6, {
    color: 'rgba(244, 114, 182, 0.95)',
    font: '10px "Segoe UI", sans-serif',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(560, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
  ctx.strokeRect(12, 10, Math.min(560, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `光电效应 · f=${f.toFixed(2)}  f₀=${f0.toFixed(2)}  Kmax=${Kmax.toFixed(2)}  ${above ? '有电子' : '低于截止'}`,
    22,
    28,
    { color: 'rgba(253, 230, 138, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '看右侧账本：只有 hf>W 才有 Kmax；调 I 只改电子个数，不改 Kmax', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
