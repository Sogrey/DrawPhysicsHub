import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import { thinFilmState } from './thinFilm'

export function thinFilmWorldBounds(): WorldBounds {
  return { xMin: -0.4, xMax: 7.2, yMin: -2.6, yMax: 2.6 }
}

function wavelengthColor(lam: number, alpha = 1): string {
  // lam in 0.4–0.7 teaching units → approx RGB
  const t = Math.max(0, Math.min(1, (lam - 0.4) / 0.3))
  const r = Math.floor(255 * Math.min(1, t * 2))
  const g = Math.floor(255 * (t < 0.5 ? t * 2 : 2 - t * 2))
  const b = Math.floor(255 * Math.min(1, (1 - t) * 2))
  return `rgba(${r},${g},${b},${alpha})`
}

export function drawThinFilmFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const n = Number(snap.values.n ?? 1.33)
  const lambda = Number(snap.values.lambda ?? 0.55)
  const d = Number(snap.values.d ?? 0.3)
  const I = Number(snap.values.I ?? 0)
  const delta = Number(snap.values.delta ?? 0)
  const ratio = Number(snap.values.ratio ?? 0)
  const bright = Number(snap.values.bright ?? 0) > 0.5
  const dark = Number(snap.values.dark ?? 0) > 0.5
  const spectrum = snap.values.spectrum
  const nBands = Number(snap.values.nBands ?? 7)

  const cy = sy(0)
  const filmTop = 0.85
  const filmBot = filmTop - Math.min(1.6, 0.25 + d * 0.9)
  const x0 = 1.8
  const x1 = 4.2

  // —— 空气 / 膜 / 空气 ——
  ctx.fillStyle = 'rgba(56, 189, 248, 0.04)'
  ctx.fillRect(sx(world.xMin), sy(world.yMax), sx(world.xMax) - sx(world.xMin), cy - sy(world.yMax))

  // 薄膜层
  const fy0 = sy(filmTop)
  const fy1 = sy(filmBot)
  ctx.fillStyle = 'rgba(167, 139, 250, 0.28)'
  ctx.fillRect(sx(x0), fy0, sx(x1) - sx(x0), fy1 - fy0)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.95)'
  ctx.lineWidth = 2
  ctx.strokeRect(sx(x0), fy0, sx(x1) - sx(x0), fy1 - fy0)
  drawDiagramLabel(ctx, `薄膜 n=${n.toFixed(2)}`, sx(x0) + 8, fy0 - 8, {
    color: 'rgba(167, 139, 250, 0.95)',
  })
  drawDiagramLabel(ctx, `d=${d.toFixed(3)}`, sx((x0 + x1) / 2) - 16, (fy0 + fy1) / 2 + 4, {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })

  // 下介质示意
  ctx.fillStyle = 'rgba(71, 85, 105, 0.35)'
  ctx.fillRect(sx(x0), fy1, sx(x1) - sx(x0), sy(world.yMin) - fy1)
  drawDiagramLabel(ctx, '空气 / 基底', sx(x0) + 8, fy1 + 18, {
    color: 'rgba(148, 163, 184, 0.85)',
    font: '11px "Segoe UI", sans-serif',
  })

  // —— 入射光线 ——
  const ix = x0 - 0.9
  const iy = filmTop + 1.1
  drawArrow(ctx, sx(ix), sy(iy), sx(x0 + 0.35), sy(filmTop), 'rgba(74, 222, 128, 0.95)', 2.4)
  drawDiagramLabel(ctx, '入射', sx(ix) - 8, sy(iy) - 8, {
    color: 'rgba(74, 222, 128, 0.95)',
  })

  // 上表面反射（半波损失）— 金色
  drawArrow(
    ctx,
    sx(x0 + 0.35),
    sy(filmTop),
    sx(x0 - 0.5),
    sy(filmTop + 1.0),
    'rgba(251, 191, 36, 0.95)',
    2.2,
  )
  drawDiagramLabel(ctx, '① 上表面（半波损失）', sx(x0 - 1.5), sy(filmTop + 1.15), {
    color: 'rgba(251, 191, 36, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // 进入膜内再下表面反射 — 蓝色
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
  ctx.lineWidth = 1.8
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(sx(x0 + 0.35), sy(filmTop))
  ctx.lineTo(sx(x0 + 0.85), sy(filmBot))
  ctx.lineTo(sx(x0 + 1.35), sy(filmTop))
  ctx.stroke()
  ctx.setLineDash([])
  drawArrow(
    ctx,
    sx(x0 + 1.35),
    sy(filmTop),
    sx(x0 + 0.6),
    sy(filmTop + 1.05),
    'rgba(56, 189, 248, 0.95)',
    2.2,
  )
  drawDiagramLabel(ctx, '② 下表面（多走 2nd）', sx(x0 + 0.9), sy(filmTop + 1.2), {
    color: 'rgba(56, 189, 248, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // 光程差标注
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx(x1 + 0.15), sy(filmTop))
  ctx.lineTo(sx(x1 + 0.15), sy(filmBot))
  ctx.stroke()
  drawDiagramLabel(ctx, `δ=2nd=${delta.toFixed(3)}`, sx(x1 + 0.25), (fy0 + fy1) / 2, {
    color: 'rgba(196, 181, 253, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // —— 右侧：反射强度指示 + 光谱色带 ——
  const bx = 5.2
  const by0 = 1.6
  const by1 = -1.8
  // 单色强度条
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'
  ctx.fillRect(sx(bx), sy(by0), sx(bx + 0.55) - sx(bx), sy(by1) - sy(by0))
  const barH = (sy(by1) - sy(by0)) * I
  const glow = wavelengthColor(lambda, 0.35 + 0.65 * I)
  ctx.fillStyle = glow
  ctx.fillRect(sx(bx), sy(by1) - barH, sx(bx + 0.55) - sx(bx), barH)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)'
  ctx.strokeRect(sx(bx), sy(by0), sx(bx + 0.55) - sx(bx), sy(by1) - sy(by0))
  drawDiagramLabel(ctx, `I(${lambda.toFixed(2)})`, sx(bx) - 4, sy(by0) - 10, {
    color: 'rgba(125, 211, 252, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, I.toFixed(2), sx(bx) + 4, sy(by1) + 16, {
    color: 'rgba(226, 232, 240, 0.9)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })

  // 白光光谱色带（同一 d，不同 λ）
  const sx0 = 5.95
  const bandW = 0.9
  if (spectrum instanceof Float32Array) {
    for (let i = 0; i < nBands; i++) {
      const lam = 0.4 + (0.3 * i) / Math.max(1, nBands - 1)
      const Ii = spectrum[i] ?? thinFilmState(n, d, lam).I
      const yA = by0 - ((by0 - by1) * i) / nBands
      const yB = by0 - ((by0 - by1) * (i + 1)) / nBands
      ctx.fillStyle = wavelengthColor(lam, 0.2 + 0.8 * Ii)
      ctx.fillRect(sx(sx0), sy(yA), sx(sx0 + bandW) - sx(sx0), sy(yB) - sy(yA))
    }
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
    ctx.strokeRect(sx(sx0), sy(by0), sx(sx0 + bandW) - sx(sx0), sy(by1) - sy(by0))
  }
  drawDiagramLabel(ctx, '白光色带', sx(sx0), sy(by0) - 10, {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '紫↑ 红↓', sx(sx0), sy(by1) + 16, {
    color: 'rgba(148, 163, 184, 0.85)',
    font: '10px "Segoe UI", sans-serif',
  })

  // 顶栏公式对照
  const s = thinFilmState(n, d, lambda)
  const tone = dark ? 'rgba(248,113,113,0.95)' : bright ? 'rgba(74,222,128,0.95)' : 'rgba(251,191,36,0.95)'
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(580, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxW, 52)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, 52)
  drawDiagramLabel(ctx, s.condition, boxX + 10, boxY + 18, {
    color: tone,
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `δ=2nd=${delta.toFixed(3)}  δ/λ=${ratio.toFixed(3)}  I=sin²(π·δ/λ)=${I.toFixed(3)}  λ=${lambda.toFixed(2)}`,
    boxX + 10,
    boxY + 38,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )

  drawDiagramLabel(
    ctx,
    '播放：厚度 d 增大 · ①半波损失 + ②光程 2nd → 反射亮暗交替',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
