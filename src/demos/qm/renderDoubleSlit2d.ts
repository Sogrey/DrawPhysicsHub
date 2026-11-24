import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import { drawDiagramLabel, drawDimLine, fillDarkViewport } from '@/core/render/primitives2d'
import {
  drawCircularWavefronts,
  paintCoherentIntensityField,
} from '@/demos/optics/wavefronts2d'

export function drawQmDoubleSlitFrame(host: Canvas2DHost, snap: ObserveSnapshot): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const d = Number(snap.values.d ?? 1.2)
  const lambda = Number(snap.values.lambda ?? 0.35)
  const L = Number(snap.values.L ?? 4)
  const fringe = Number(snap.values.fringe ?? 1)
  const t = Number(snap.time ?? 0)
  const period = Number(snap.values.period ?? 8)
  const reveal = Number(snap.values.reveal ?? 1)
  const phaseLen = ((t / period) * lambda * 6) % Math.max(0.05, lambda)
  const phaseRad = (2 * Math.PI * t) / period

  // 统一世界坐标：缝在 x=0，屏在 x=L，波前圆心就在缝口
  const half = d / 2
  const yMax = Number(snap.values.yMax ?? 3)
  const worldLeft = -2.4
  const worldRight = L + 1.4
  const worldY = Math.max(3.4, yMax * 1.15, half + 1.2)
  const padL = 36
  const padR = 90
  const midY = H * 0.56
  const sx = (x: number) => padL + ((x - worldLeft) / (worldRight - worldLeft)) * (W - padL - padR)
  const sy = (y: number) => midY - (y / worldY) * (H * 0.4)
  const map = { sx, sy }

  const slitX = 0
  const screenX = L
  const gap = 0.14
  const sources = [
    { x: slitX, y: half },
    { x: slitX, y: -half },
  ]

  // ① 空间干涉场：紧贴缝口右侧开始
  paintCoherentIntensityField(ctx, map, sources, {
    lambda,
    phaseRad,
    x0: slitX + 0.02,
    x1: screenX - 0.05,
    y0: -worldY * 0.92,
    y1: worldY * 0.92,
    nx: 80,
    ny: 60,
    tint: 'blue',
    alpha: 0.55 + 0.3 * reveal,
  })

  // ② 入射波前（源 → 缝）
  drawCircularWavefronts(ctx, map, -2.1, 0, {
    lambda,
    phase: phaseLen,
    rMin: lambda * 0.35,
    rMax: 2.0,
    strokeStyle: 'rgba(186, 230, 253, 0.4)',
    startAngle: -0.55,
    endAngle: 0.55,
  })

  // ③ 两缝圆形辅助波前 —— 圆心就在缝口，rMin 很小贴着缝
  const rMax = Math.min(L * 0.92, 3.6) * (0.4 + 0.6 * reveal)
  drawCircularWavefronts(ctx, map, slitX, half, {
    lambda,
    phase: phaseLen,
    rMin: lambda * 0.15,
    rMax,
    strokeStyle: 'rgba(125, 211, 252, 0.55)',
    startAngle: -1.05,
    endAngle: 1.1,
    lineWidth: 1.4,
  })
  drawCircularWavefronts(ctx, map, slitX, -half, {
    lambda,
    phase: phaseLen,
    rMin: lambda * 0.15,
    rMax,
    strokeStyle: 'rgba(167, 139, 250, 0.5)',
    startAngle: -1.1,
    endAngle: 1.05,
    lineWidth: 1.4,
  })

  // 隔板：只在 ±half 两处开口，中间必须是实体（不是第三道缝）
  const yTop = worldY * 0.95
  const yBot = -worldY * 0.95
  const x0 = sx(slitX - 0.08)
  const x1 = sx(slitX + 0.08)
  ctx.fillStyle = 'rgba(100, 116, 139, 0.92)'
  const solid: [number, number][] = [
    [yTop, half + gap], // 上缝以上
    [half - gap, -half + gap], // 两缝之间的挡板实体
    [-half - gap, yBot], // 下缝以下
  ]
  for (const [ya, yb] of solid) {
    if (ya <= yb) continue
    ctx.fillRect(x0, sy(ya), x1 - x0, sy(yb) - sy(ya))
  }
  // 缝口边缘描金（开口本身留空，波从这里出去）
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.98)'
  ctx.lineWidth = 2.5
  for (const y of [half, -half]) {
    ctx.strokeRect(sx(slitX - 0.11), sy(y + gap), sx(slitX + 0.11) - sx(slitX - 0.11), sy(y - gap) - sy(y + gap))
  }

  drawDimLine(ctx, sx(slitX + 0.22), sy(half), sx(slitX + 0.22), sy(-half), `缝距 d=${d.toFixed(2)}`, {
    color: 'rgba(251, 191, 36, 0.95)',
    offset: 0,
  })

  // 探测屏
  ctx.fillStyle = 'rgba(167, 139, 250, 0.4)'
  ctx.fillRect(sx(screenX) - 4, sy(yTop), 12, sy(yBot) - sy(yTop))
  drawDiagramLabel(ctx, '探测屏 I(y)', sx(screenX) - 8, sy(yTop) - 10, {
    color: 'rgba(167, 139, 250, 0.95)',
    font: 'bold 11px "Segoe UI", sans-serif',
  })

  const dens = snap.values.dens
  const ys = snap.values.ys
  const nSamp = Number(snap.values.nSamp ?? 0)
  if (dens instanceof Float32Array && ys instanceof Float32Array && nSamp > 2) {
    const iMax = Number(snap.values.iMax ?? 1)
    for (let i = 0; i < nSamp; i++) {
      const y = ys[i]!
      const bright = (dens[i]! / iMax) * reveal
      ctx.fillStyle = `rgba(56, 189, 248, ${0.15 + 0.8 * bright})`
      ctx.fillRect(sx(screenX) + 12, sy(y) - 2, 10 + 42 * bright, 4)
    }
  }

  // 路径虚线：源 → 缝 → 屏中心
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.4)'
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(sx(-2.2), sy(0))
  ctx.lineTo(sx(slitX - 0.12), sy(half))
  ctx.moveTo(sx(-2.2), sy(0))
  ctx.lineTo(sx(slitX - 0.12), sy(-half))
  ctx.moveTo(sx(slitX + 0.12), sy(half))
  ctx.lineTo(sx(screenX), sy(0))
  ctx.moveTo(sx(slitX + 0.12), sy(-half))
  ctx.lineTo(sx(screenX), sy(0))
  ctx.stroke()
  ctx.setLineDash([])

  // 条纹间距标记
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
  ctx.lineWidth = 1.5
  for (const sign of [-1, 1] as const) {
    const y = sign * fringe
    ctx.beginPath()
    ctx.moveTo(sx(screenX) + 10, sy(y))
    ctx.lineTo(sx(screenX) + 48, sy(y))
    ctx.stroke()
  }
  drawDimLine(ctx, sx(screenX) + 52, sy(fringe), sx(screenX) + 52, sy(-fringe), `Δy≈${fringe.toFixed(2)}`, {
    color: 'rgba(251, 191, 36, 0.95)',
    offset: 0,
  })
  drawDiagramLabel(ctx, '中央亮纹', sx(screenX) + 58, sy(0) + 4, {
    color: 'rgba(56, 189, 248, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  drawDiagramLabel(ctx, '青弧=上缝', sx(slitX + 0.35), sy(half + 0.35), {
    color: 'rgba(125, 211, 252, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '紫弧=下缝', sx(slitX + 0.35), sy(-half - 0.15), {
    color: 'rgba(167, 139, 250, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '相长干涉', sx(L * 0.45), sy(0.25), {
    color: 'rgba(74, 222, 128, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(560, W - 24), 48)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
  ctx.strokeRect(12, 10, Math.min(560, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `电子双缝 · Δy≈${fringe.toFixed(2)}  λ=${lambda.toFixed(2)}  d=${d.toFixed(2)}`,
    22,
    28,
    { color: 'rgba(186, 230, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '波前圆心在缝口；播放可见辅助波从缝向外扩并干涉', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
