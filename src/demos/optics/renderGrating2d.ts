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
  drawFringeOrderMarks,
  drawIntensityCurvePanel,
  drawIntensityFormulaHud,
  drawPathDifferenceCallout,
  drawPlaneWaveArrows,
  paintCoherentIntensityField,
  type PointSource,
} from './wavefronts2d'
import { gratingIntensity } from './grating'

export function gratingWorldBounds(worldX: number, worldY: number): WorldBounds {
  return {
    xMin: -2.8,
    xMax: worldX + 2.2,
    yMin: -worldY,
    yMax: worldY,
  }
}

function slitCenters(slitX: number, N: number, d: number): PointSource[] {
  const n = Math.max(2, Math.round(N))
  const span = (n - 1) * d
  const y0 = -span / 2
  const out: PointSource[] = []
  for (let i = 0; i < n; i++) {
    out.push({ x: slitX, y: y0 + i * d })
  }
  return out
}

export function drawGratingFrame(
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

  const a = Number(snap.values.a ?? 0.35)
  const d = Number(snap.values.d ?? 1.2)
  const L = Number(snap.values.L ?? 6)
  const N = Math.max(2, Math.round(Number(snap.values.N ?? 5)))
  const lambda = Number(snap.values.lambda ?? 0.5)
  const y1 = Number(snap.values.y1 ?? 1)
  const yMax = Number(snap.values.yMax ?? 4)
  const nScreen = Number(snap.values.nScreen ?? 160)
  const screenI = snap.values.screenI
  const slitX = 0
  const screenX = L
  const t = Number(snap.time ?? 0)
  const period = Number(snap.values.period ?? 8)
  const phaseRad = (2 * Math.PI * t) / period

  const centers = slitCenters(slitX, N, d)
  const gratingHalf = ((N - 1) * d) / 2 + a / 2

  drawPlaneWaveArrows(ctx, map, {
    x0: -2.4,
    x1: -0.35,
    yMin: -Math.min(gratingHalf + 0.4, yMax * 0.55),
    yMax: Math.min(gratingHalf + 0.4, yMax * 0.55),
    rows: Math.min(8, N + 2),
    strokeStyle: 'rgba(74, 222, 128, 0.85)',
  })
  drawDiagramLabel(ctx, '① 入射平面波', sx(-2.35), sy(Math.min(gratingHalf + 0.4, yMax * 0.55)) - 10, {
    color: 'rgba(74, 222, 128, 0.9)',
  })

  // 多缝相干场（以缝心为源，示意干涉）
  paintCoherentIntensityField(ctx, map, centers, {
    lambda,
    phaseRad,
    x0: slitX + 0.12,
    x1: screenX - 0.08,
    y0: -yMax * 0.92,
    y1: yMax * 0.92,
    nx: 84,
    ny: 66,
    tint: 'green',
    alpha: 0.7,
  })

  // 挡板 + N 缝
  ctx.fillStyle = 'rgba(71, 85, 105, 0.96)'
  const bx0 = sx(slitX - 0.12)
  const bx1 = sx(slitX + 0.12)
  const span = (N - 1) * d
  const yTop = span / 2 + a / 2
  const yBot = -yTop
  // 上下挡板
  ctx.fillRect(bx0, sy(world.yMax), bx1 - bx0, sy(yTop) - sy(world.yMax))
  ctx.fillRect(bx0, sy(yBot), bx1 - bx0, sy(world.yMin) - sy(yBot))
  // 缝间挡板
  for (let i = 0; i < N - 1; i++) {
    const yc0 = -span / 2 + i * d
    const yc1 = yc0 + d
    const top = yc0 + a / 2
    const bot = yc1 - a / 2
    if (bot > top) {
      ctx.fillRect(bx0, sy(bot), bx1 - bx0, sy(top) - sy(bot))
    }
  }
  // 缝开口标记
  for (const c of centers) {
    ctx.fillStyle = 'rgba(248, 113, 113, 0.35)'
    ctx.fillRect(
      sx(slitX - 0.06),
      sy(c.y + a / 2),
      sx(slitX + 0.06) - sx(slitX - 0.06),
      sy(c.y - a / 2) - sy(c.y + a / 2),
    )
    ctx.fillStyle = '#f87171'
    ctx.beginPath()
    ctx.arc(sx(c.x), sy(c.y), 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
  if (centers.length >= 2) {
    drawDimLine(
      ctx,
      sx(slitX),
      sy(centers[0]!.y),
      sx(slitX),
      sy(centers[1]!.y),
      `d=${d.toFixed(2)}`,
      { offset: -20 },
    )
  }
  drawDimLine(ctx, sx(slitX + 0.35), sy(-a / 2), sx(slitX + 0.35), sy(a / 2), `a=${a.toFixed(2)}`, {
    offset: 14,
  })
  drawDiagramLabel(ctx, `② N=${N} 缝光栅`, sx(slitX) + 14, sy(yTop) + 4, {
    color: 'rgba(248, 113, 113, 0.9)',
  })

  // 屏条纹
  const fringeW = Math.max(28, sx(screenX + 0.85) - sx(screenX))
  if (screenI instanceof Float32Array) {
    for (let i = 0; i < nScreen; i++) {
      const y0 = -yMax + (2 * yMax * i) / Math.max(1, nScreen - 1)
      const y1b = -yMax + (2 * yMax * (i + 1)) / Math.max(1, nScreen - 1)
      const I = screenI[i]!
      const g = Math.floor(30 + 220 * I)
      ctx.fillStyle = `rgb(${Math.floor(g * 0.25)}, ${g}, ${Math.floor(g * 0.35)})`
      ctx.fillRect(sx(screenX), sy(y1b), fringeW, Math.max(1, sy(y0) - sy(y1b)))
    }
  }
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(sx(screenX), sy(yMax), fringeW, sy(-yMax) - sy(yMax))
  drawDiagramLabel(ctx, '③ 屏上主极大', sx(screenX) + 4, sy(yMax) - 6, {
    color: 'rgba(74, 222, 128, 0.9)',
  })

  if (screenI instanceof Float32Array) {
    // 包络曲线（单缝）叠在旁侧
    const env = new Float32Array(nScreen)
    for (let i = 0; i < nScreen; i++) {
      const y = -yMax + (2 * yMax * i) / Math.max(1, nScreen - 1)
      env[i] = gratingIntensity(y, lambda, a, d, L, N).envelope
    }
    drawIntensityCurvePanel(ctx, map, {
      x0: screenX + 1.1,
      width: 1.8,
      yMin: -yMax,
      yMax,
      values: screenI,
      strokeStyle: 'rgba(74, 222, 128, 0.95)',
      fillStyle: 'rgba(74, 222, 128, 0.12)',
      label: 'I(y)·光栅',
      probeY: Number(snap.values.y ?? 0),
      probeI: Number(snap.values.I ?? 0),
    })
    // 淡紫包络参考
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.75)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    const px0 = sx(screenX + 1.1)
    const pw = sx(screenX + 1.1 + 1.8) - px0
    for (let i = 0; i < nScreen; i++) {
      const y = -yMax + (2 * yMax * i) / Math.max(1, nScreen - 1)
      const x = px0 + env[i]! * pw
      if (i === 0) ctx.moveTo(x, sy(y))
      else ctx.lineTo(x, sy(y))
    }
    ctx.stroke()
    drawDiagramLabel(ctx, '包络 sinc²', sx(screenX + 2.5), sy(yMax) - 6, {
      color: 'rgba(167, 139, 250, 0.9)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  // 主极大级次
  const orders: { y: number; label: string; kind: 'bright' | 'dark' }[] = [
    { y: 0, label: 'm=0', kind: 'bright' },
  ]
  const mMax = Math.floor(yMax / Math.max(y1, 1e-6))
  for (let m = 1; m <= mMax; m++) {
    orders.push({ y: m * y1, label: `m=${m}`, kind: 'bright' })
    orders.push({ y: -m * y1, label: `m=${-m}`, kind: 'bright' })
  }
  drawFringeOrderMarks(ctx, map, {
    screenX,
    barW: fringeW,
    orders,
    yClip: yMax * 0.98,
  })

  if (y1 < yMax) {
    drawDimLine(ctx, sx(screenX + 0.55), sy(0), sx(screenX + 0.55), sy(y1), `y₁=${y1.toFixed(2)}`, {
      offset: 12,
    })
  }

  const yProbe = Number(snap.values.y ?? 0)
  const I = Number(snap.values.I ?? 0)
  const gLive = gratingIntensity(yProbe, lambda, a, d, L, N)
  const match = Math.abs(gLive.I - I) < 0.03
  const atMax = Math.abs(I) > 0.55 && Math.abs(Math.abs(yProbe / y1) - Math.round(Math.abs(yProbe / y1))) < 0.15
  const atDark = I < 0.08

  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(sx(screenX) + fringeW * 0.45, sy(yProbe), 6, 0, Math.PI * 2)
  ctx.fill()

  if (centers.length >= 2) {
    const edge = [centers[0]!, centers[centers.length - 1]!]
    const r1 = Math.hypot(screenX - edge[0].x, yProbe - edge[0].y)
    const r2 = Math.hypot(screenX - edge[1].x, yProbe - edge[1].y)
    const deltaEdge = r1 - r2
    const phiDeg = ((deltaEdge / lambda) * 360) % 360
    drawPathDifferenceCallout(ctx, map, {
      sources: edge,
      probe: { x: screenX, y: yProbe },
      lambda,
      delta: deltaEdge,
      phiDeg: phiDeg > 180 ? phiDeg - 360 : phiDeg,
      I,
    })
  }

  drawIntensityFormulaHud(ctx, {
    W,
    title: '公式 ↔ 画面对照（黄点 = 探测点）',
    formulaLine: `I∝sinc²(β)·[sin(Nδ/2)/sin(δ/2)]²  β=${gLive.beta.toFixed(2)}  δ=${gLive.delta.toFixed(2)}  → I=${gLive.I.toFixed(3)}`,
    detailLine: `y₁=λL/d=${y1.toFixed(2)}  N=${N}  d=${d.toFixed(2)}  a=${a.toFixed(2)}  y=${yProbe.toFixed(2)}`,
    verdict: atMax ? '主极大附近' : atDark ? '暗纹 / 次峰谷' : '过渡 / 次极大',
    verdictTone: atMax ? 'bright' : atDark ? 'dark' : 'mid',
    match,
  })
}
