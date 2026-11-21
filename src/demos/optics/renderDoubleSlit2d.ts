import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import {
  drawCircularWavefronts,
  drawFringeOrderMarks,
  drawIntensityCurvePanel,
  drawIntensityFormulaHud,
  drawPathDifferenceCallout,
  paintCoherentIntensityField,
} from './wavefronts2d'

export function doubleSlitWorldBounds(worldX: number, worldY: number): WorldBounds {
  return {
    xMin: -3.2,
    xMax: worldX + 1.8,
    yMin: -worldY,
    yMax: worldY,
  }
}

function drawBarrier(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  x: number,
  yTop: number,
  yBot: number,
  openings: { y: number; half: number }[],
): void {
  ctx.fillStyle = 'rgba(71, 85, 105, 0.96)'
  const x0 = sx(x - 0.1)
  const x1 = sx(x + 0.1)
  const edges = [yTop, ...openings.flatMap((o) => [o.y + o.half, o.y - o.half]), yBot]
  for (let i = 0; i < edges.length - 1; i += 2) {
    const ya = edges[i]!
    const yb = edges[i + 1]!
    if (ya <= yb) continue
    ctx.fillRect(x0, sy(ya), x1 - x0, sy(yb) - sy(ya))
  }
}

export function drawDoubleSlitFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
  _opts?: { compare?: CompareTrail | null },
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })
  const map = { sx, sy }

  const d = Number(snap.values.d ?? 1.2)
  const L = Number(snap.values.L ?? 6)
  const lambda = Number(snap.values.lambda ?? 0.5)
  const dy = Number(snap.values.dy ?? 1)
  const yMax = Number(snap.values.yMax ?? 4)
  const nScreen = Number(snap.values.nScreen ?? 120)
  const screenI = snap.values.screenI
  const t = Number(snap.time ?? 0)
  const period = Number(snap.values.period ?? 6)
  const phaseLen = ((t / period) * lambda * 5) % lambda
  const phaseRad = (2 * Math.PI * t) / period

  const sourceX = -2.4
  const slitX = 0
  const screenX = L
  const half = d / 2
  const gap = 0.16
  const sources = [
    { x: slitX, y: half },
    { x: slitX, y: -half },
  ]

  // ① 空间干涉光场：两缝相干叠加 |ψ|² —— 条纹在空间中形成
  paintCoherentIntensityField(ctx, map, sources, {
    lambda,
    phaseRad,
    x0: slitX + 0.15,
    x1: screenX - 0.08,
    y0: -yMax * 0.92,
    y1: yMax * 0.92,
    nx: 80,
    ny: 64,
    tint: 'blue',
    alpha: 0.78,
  })

  // ② 波面弧线（叠加在光场上，标示波峰传播）
  drawCircularWavefronts(ctx, map, sourceX, 0, {
    lambda,
    phase: phaseLen,
    rMin: lambda * 0.5,
    rMax: slitX - sourceX - 0.15,
    strokeStyle: 'rgba(186, 230, 253, 0.45)',
    startAngle: -0.7,
    endAngle: 0.7,
  })
  drawCircularWavefronts(ctx, map, slitX, half, {
    lambda,
    phase: phaseLen,
    rMin: lambda * 0.4,
    rMax: Math.min(L * 0.55, 3.2),
    strokeStyle: 'rgba(125, 211, 252, 0.35)',
    startAngle: -0.9,
    endAngle: 0.9,
  })
  drawCircularWavefronts(ctx, map, slitX, -half, {
    lambda,
    phase: phaseLen,
    rMin: lambda * 0.4,
    rMax: Math.min(L * 0.55, 3.2),
    strokeStyle: 'rgba(147, 197, 253, 0.35)',
    startAngle: -0.9,
    endAngle: 0.9,
  })

  // 中央轴 = 零光程差 → 始终相长
  ctx.save()
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(sx(slitX), sy(0))
  ctx.lineTo(sx(screenX), sy(0))
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
  drawDiagramLabel(ctx, 'δ=0 相长', sx(L * 0.45), sy(0) - 12, {
    color: 'rgba(74, 222, 128, 0.9)',
  })

  // barriers
  drawBarrier(ctx, sx, sy, sourceX, world.yMax, world.yMin, [{ y: 0, half: gap }])
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(sx(sourceX), sy(0), 5, 0, Math.PI * 2)
  ctx.fill()
  drawDiagramLabel(ctx, 'O 光源', sx(sourceX) - 28, sy(0) - 14, { color: 'rgba(56,189,248,0.95)' })

  drawBarrier(ctx, sx, sy, slitX, world.yMax, world.yMin, [
    { y: half, half: gap },
    { y: -half, half: gap },
  ])
  for (const [yy, label] of [
    [half, 'A₁'],
    [-half, 'A₂'],
  ] as const) {
    ctx.fillStyle = '#f87171'
    ctx.beginPath()
    ctx.arc(sx(slitX), sy(yy), 5, 0, Math.PI * 2)
    ctx.fill()
    drawDiagramLabel(ctx, label, sx(slitX) + 10, sy(yy) - 8, { color: 'rgba(248,113,113,0.95)' })
  }
  drawDimLine(ctx, sx(slitX), sy(-half), sx(slitX), sy(half), `d=${d.toFixed(2)}`, { offset: -20 })

  // screen + I(y)
  const barW = Math.max(12, sx(screenX + 0.5) - sx(screenX))
  if (screenI instanceof Float32Array) {
    for (let i = 0; i < nScreen; i++) {
      const y0 = -yMax + (2 * yMax * i) / Math.max(1, nScreen - 1)
      const y1 = -yMax + (2 * yMax * (i + 1)) / Math.max(1, nScreen - 1)
      const I = screenI[i]!
      const g = Math.floor(45 + 200 * I)
      ctx.fillStyle = `rgb(${Math.floor(g * 0.4)}, ${Math.floor(g * 0.75)}, ${g})`
      ctx.fillRect(sx(screenX), sy(y1), barW, Math.max(1, sy(y0) - sy(y1)))
    }
  }
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(sx(screenX), sy(yMax))
  ctx.lineTo(sx(screenX), sy(-yMax))
  ctx.stroke()
  drawDiagramLabel(ctx, '屏', sx(screenX) + 6, sy(yMax) + 2, { color: 'rgba(226,232,240,0.9)' })

  if (screenI instanceof Float32Array) {
    drawIntensityCurvePanel(ctx, map, {
      x0: screenX + 0.7,
      width: 1.5,
      yMin: -yMax,
      yMax,
      values: screenI,
      strokeStyle: 'rgba(56, 189, 248, 0.95)',
      fillStyle: 'rgba(56, 189, 248, 0.1)',
      label: 'I(y)',
      probeY: Number(snap.values.y ?? 0),
      probeI: Number(snap.values.I ?? 0),
    })
  }

  if (dy < yMax) {
    drawDimLine(ctx, sx(screenX + 0.35), sy(0), sx(screenX + 0.35), sy(dy), `Δy=${dy.toFixed(2)}`, {
      offset: -12,
    })
  }

  // 亮纹级次标记 y = m Δy
  const fringeOrders: { y: number; label: string; kind: 'bright' | 'dark' }[] = []
  const mMax = Math.floor(yMax / Math.max(dy, 1e-6))
  for (let m = -mMax; m <= mMax; m++) {
    fringeOrders.push({ y: m * dy, label: m === 0 ? 'm=0' : `m=${m}`, kind: 'bright' })
    if (m >= 0) {
      const yd = (m + 0.5) * dy
      if (yd < yMax) fringeOrders.push({ y: yd, label: `暗`, kind: 'dark' })
      if (m > 0 && -yd > -yMax) fringeOrders.push({ y: -yd, label: `暗`, kind: 'dark' })
    }
  }
  drawFringeOrderMarks(ctx, map, {
    screenX,
    barW,
    orders: fringeOrders,
    yClip: yMax * 0.98,
  })

  // ③ 探测点光程差 → 相长/相消原理
  const yProbe = Number(snap.values.y ?? 0)
  const I = Number(snap.values.I ?? 0)
  const delta = Number(snap.values.delta ?? 0)
  const phiDeg = Number(snap.values.phiDeg ?? 0)
  // 公式代入：与模型 intensityAt 同一式
  const arg = (Math.PI * d * yProbe) / (lambda * L)
  const Iformula = Math.cos(arg) ** 2
  const match = Math.abs(Iformula - I) < 0.02
  const constructive = I > 0.55
  const destructive = I < 0.2

  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(sx(screenX) + barW * 0.5, sy(yProbe), 6, 0, Math.PI * 2)
  ctx.fill()
  drawPathDifferenceCallout(ctx, map, {
    sources,
    probe: { x: screenX, y: yProbe },
    lambda,
    delta,
    phiDeg,
    I,
  })

  drawIntensityFormulaHud(ctx, {
    W,
    title: '公式 ↔ 画面对照（黄点 = 探测点）',
    formulaLine: `I = cos²(π d y /(λ L)) = cos²(${arg.toFixed(2)}) = ${Iformula.toFixed(3)}`,
    detailLine: `δ = d·y/L = ${delta.toFixed(3)}   Δy = λL/d = ${dy.toFixed(2)}   y = ${yProbe.toFixed(2)}`,
    verdict: constructive ? '相长（亮）' : destructive ? '相消（暗）' : '部分干涉',
    verdictTone: constructive ? 'bright' : destructive ? 'dark' : 'mid',
    match,
  })
}
