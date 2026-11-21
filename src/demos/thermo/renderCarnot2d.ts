import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import { carnotStateAt } from './carnot'

export function carnotWorldBounds(): WorldBounds {
  // 逻辑坐标稍后映射到 V–P；这里用占位世界，实际用自定义映射
  return { xMin: -0.2, xMax: 8, yMin: -0.4, yMax: 5.2 }
}

export function drawCarnotFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  _world: WorldBounds,
): void {
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

  const Vmin = Number(snap.values.Vmin ?? 0.8)
  const Vmax = Number(snap.values.Vmax ?? 6)
  const Pmin = Number(snap.values.Pmin ?? 0.2)
  const Pmax = Number(snap.values.Pmax ?? 4)
  const V0 = Vmin * 0.85
  const V1 = Vmax * 1.08
  const P0 = Math.max(0.05, Pmin * 0.75)
  const P1 = Pmax * 1.12

  const sx = (V: number) => padL + ((V - V0) / (V1 - V0)) * plotW
  const sy = (P: number) => padT + plotH - ((P - P0) / (P1 - P0)) * plotH

  // 背景网格（轻）
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

  // 坐标轴
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

  const Th = Number(snap.values.Th ?? 3)
  const Tc = Number(snap.values.Tc ?? 1.2)
  const V1p = Number(snap.values.V1 ?? 1)
  const r = Number(snap.values.r ?? 2)
  const gamma = Number(snap.values.gamma ?? 1.4)
  const Vs = snap.values.Vs
  const Ps = snap.values.Ps
  const nLoop = Number(snap.values.nLoop ?? 0)
  const stage = Number(snap.values.stage ?? 0)
  const V = Number(snap.values.V ?? 1)
  const P = Number(snap.values.P ?? 1)
  const T = Number(snap.values.T ?? 1)
  const eta = Number(snap.values.eta ?? 0)
  const Qh = Number(snap.values.Qh ?? 0)
  const Qc = Number(snap.values.Qc ?? 0)
  const Work = Number(snap.values.W ?? 0)

  // 填充环路面积
  if (Vs instanceof Float32Array && Ps instanceof Float32Array && nLoop > 4) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)'
    ctx.beginPath()
    for (let i = 0; i < nLoop; i++) {
      const x = sx(Vs[i]!)
      const y = sy(Ps[i]!)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()

    // 分段着色描边
    const nPer = Math.floor((nLoop - 1) / 4)
    const colors = [
      'rgba(251, 191, 36, 0.95)', // 等温 Th
      'rgba(74, 222, 128, 0.95)', // 绝热
      'rgba(251, 191, 36, 0.75)', // 等温 Tc
      'rgba(74, 222, 128, 0.75)', // 绝热
    ]
    for (let seg = 0; seg < 4; seg++) {
      ctx.strokeStyle = colors[seg]!
      ctx.lineWidth = stage === seg ? 3.2 : 2
      ctx.beginPath()
      const i0 = seg * nPer
      const i1 = seg === 3 ? nLoop - 1 : (seg + 1) * nPer
      for (let i = i0; i <= i1; i++) {
        const x = sx(Vs[i]!)
        const y = sy(Ps[i]!)
        if (i === i0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }

  // 角点
  const corners = [
    [Number(snap.values.c1V), Number(snap.values.c1P), '1'],
    [Number(snap.values.c2V), Number(snap.values.c2P), '2'],
    [Number(snap.values.c3V), Number(snap.values.c3P), '3'],
    [Number(snap.values.c4V), Number(snap.values.c4P), '4'],
  ] as const
  for (const [cv, cp, lab] of corners) {
    ctx.fillStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.arc(sx(cv), sy(cp), 5, 0, Math.PI * 2)
    ctx.fill()
    drawDiagramLabel(ctx, lab, sx(cv) + 8, sy(cp) - 6, {
      color: 'rgba(226, 232, 240, 0.95)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  }

  // 辅助：等温/绝热文字
  drawDiagramLabel(ctx, 'Th 等温', sx(Number(snap.values.c1V)) + 20, sy(Number(snap.values.c1P)) - 18, {
    color: 'rgba(251, 191, 36, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '绝热', sx(Number(snap.values.c2V)) + 10, sy(Number(snap.values.c2P)) + 4, {
    color: 'rgba(74, 222, 128, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, 'Tc 等温', sx(Number(snap.values.c3V)) - 50, sy(Number(snap.values.c3P)) + 16, {
    color: 'rgba(251, 191, 36, 0.75)',
    font: '11px "Segoe UI", sans-serif',
  })

  // 当前状态点
  ctx.fillStyle = '#f472b6'
  ctx.beginPath()
  ctx.arc(sx(V), sy(P), 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(sx(V), sy(P0))
  ctx.lineTo(sx(V), sy(P))
  ctx.lineTo(sx(V0), sy(P))
  ctx.stroke()
  ctx.setLineDash([])
  drawDiagramLabel(ctx, `(V,P)`, sx(V) + 10, sy(P) - 10, {
    color: 'rgba(244, 114, 182, 0.95)',
  })

  // 过程名
  const st = carnotStateAt((4 * Number(snap.time ?? 0)) / Number(snap.values.period ?? 12), Th, Tc, V1p, r, gamma)
  drawDiagramLabel(ctx, st.stageName, padL + 8, padT + plotH + 36, {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '12px "Segoe UI", sans-serif',
  })

  // 顶栏
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(640, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxW, 52)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, 52)
  drawDiagramLabel(ctx, `卡诺 · η=1−Tc/Th=${eta.toFixed(3)} · ${st.stageName}`, boxX + 10, boxY + 18, {
    color: 'rgba(251, 191, 36, 0.95)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `T=${T.toFixed(2)}  P=${P.toFixed(2)}  V=${V.toFixed(2)}  Qh=${Qh.toFixed(2)}  Qc=${Qc.toFixed(2)}  W=${Work.toFixed(2)}`,
    boxX + 10,
    boxY + 38,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
