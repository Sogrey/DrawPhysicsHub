import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import { drawDiagramLabel, drawDimLine, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'

const KIND_LABEL = ['等温', '等压', '等容', '绝热']

export function drawPvProcessFrame(host: Canvas2DHost, snap: ObserveSnapshot): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const padL = 70
  const padR = 36
  const padT = 72
  const padB = 52
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const Vmin = Number(snap.values.Vmin ?? 0.5)
  const Vmax = Number(snap.values.Vmax ?? 5)
  const Pmin = Number(snap.values.Pmin ?? 0.2)
  const Pmax = Number(snap.values.Pmax ?? 4)
  const V0a = Vmin * 0.85
  const V1a = Vmax * 1.1
  const P0a = Math.max(0.05, Pmin * 0.7)
  const P1a = Pmax * 1.15
  const sx = (V: number) => padL + ((V - V0a) / (V1a - V0a)) * plotW
  const sy = (P: number) => padT + plotH - ((P - P0a) / (P1a - P0a)) * plotH

  ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 6; i++) {
    const x = padL + (plotW * i) / 6
    const y = padT + (plotH * i) / 6
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
  drawDiagramLabel(ctx, 'V', padL + plotW - 12, padT + plotH + 18, {
    color: 'rgba(248, 113, 113, 0.95)',
  })
  drawDiagramLabel(ctx, 'P', padL - 18, padT + 8, {
    color: 'rgba(248, 113, 113, 0.95)',
  })

  const Vs = snap.values.Vs
  const Ps = snap.values.Ps
  const nPath = Number(snap.values.nPath ?? 0)
  const u = Number(snap.values.u ?? 0)
  const nShow = Math.max(2, Math.floor(u * (nPath - 1)) + 1)

  if (Vs instanceof Float32Array && Ps instanceof Float32Array && nPath > 1) {
    // work area under traversed path
    ctx.beginPath()
    ctx.moveTo(sx(Vs[0]!), sy(P0a))
    for (let i = 0; i < nShow; i++) ctx.lineTo(sx(Vs[i]!), sy(Ps[i]!))
    ctx.lineTo(sx(Vs[nShow - 1]!), sy(P0a))
    ctx.closePath()
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)'
    ctx.fill()

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let i = 0; i < nPath; i++) {
      const x = sx(Vs[i]!)
      const y = sy(Ps[i]!)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const V = Number(snap.values.V ?? 1)
  const P = Number(snap.values.P ?? 1)
  const V0p = Number(snap.values.V0 ?? 1.2)
  const V1p = Number(snap.values.V1 ?? 3.2)

  // start / end markers
  if (Vs instanceof Float32Array && Ps instanceof Float32Array && nPath > 1) {
    drawMarker(ctx, sx(Vs[0]!), sy(Ps[0]!), {
      radius: 5,
      fill: '#4ade80',
      label: '始',
      labelDx: -14,
      labelDy: -10,
    })
    drawMarker(ctx, sx(Vs[nPath - 1]!), sy(Ps[nPath - 1]!), {
      radius: 5,
      fill: '#a78bfa',
      label: '终',
      labelDx: 8,
      labelDy: -10,
    })
    drawDimLine(
      ctx,
      sx(Math.min(V0p, V1p)),
      sy(P0a) + 8,
      sx(Math.max(V0p, V1p)),
      sy(P0a) + 8,
      `ΔV: ${V0p.toFixed(1)}→${V1p.toFixed(1)}`,
      { color: 'rgba(167, 139, 250, 0.9)', offset: 0 },
    )
  }

  drawMarker(ctx, sx(V), sy(P), {
    radius: 7,
    fill: '#f472b6',
    label: `(V,P)=(${V.toFixed(2)},${P.toFixed(2)})`,
    labelDx: 10,
    labelDy: -12,
  })

  // projection guides to axes
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)'
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(sx(V), sy(P))
  ctx.lineTo(sx(V), sy(P0a))
  ctx.moveTo(sx(V), sy(P))
  ctx.lineTo(sx(V0a), sy(P))
  ctx.stroke()
  ctx.setLineDash([])

  const kindId = Math.round(Number(snap.values.kindId ?? 0))
  const Wval = Number(snap.values.W ?? 0)
  const Q = Number(snap.values.Q ?? 0)
  const dU = Number(snap.values.dU ?? 0)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(600, W - 24), 48)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
  ctx.strokeRect(12, 10, Math.min(600, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `准静态 · ${KIND_LABEL[kindId] ?? ''} · W=${Wval.toFixed(2)}  Q=${Q.toFixed(2)}  ΔU=${dU.toFixed(2)}`,
    22,
    28,
    { color: 'rgba(186, 230, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(
    ctx,
    '青阴影=已走过 ∫P dV；绿点=始 紫点=终 粉点=当前；投影虚线读 V、P',
    22,
    46,
    { color: 'rgba(226, 232, 240, 0.88)', font: '11px "Segoe UI", sans-serif' },
  )
}
