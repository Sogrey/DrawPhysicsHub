import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function entropyWorldBounds(): WorldBounds {
  return { xMin: -3.4, xMax: 3.4, yMin: -2.4, yMax: 2.6 }
}

export function drawEntropyFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const mix = Number(snap.values.mix ?? 0)
  const phase = Number(snap.values.phase ?? 0)
  const V1 = Number(snap.values.V1 ?? 1.2)
  const V2 = Number(snap.values.V2 ?? 3.2)
  const dS = Number(snap.values.dS ?? 0)
  const dSFinal = Number(snap.values.dSFinal ?? 1)

  // chambers
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.95)'
  ctx.lineWidth = 2.5
  ctx.strokeRect(sx(-2.4), sy(1.4), sx(2.4) - sx(-2.4), sy(-1.4) - sy(1.4))

  // gas fill left always, right grows
  ctx.fillStyle = `rgba(56, 189, 248, ${0.22 + 0.18 * (1 - mix)})`
  ctx.fillRect(sx(-2.4), sy(1.4), sx(0) - sx(-2.4), sy(-1.4) - sy(1.4))
  ctx.fillStyle = `rgba(56, 189, 248, ${0.04 + 0.38 * mix})`
  ctx.fillRect(sx(0), sy(1.4), sx(2.4) - sx(0), sy(-1.4) - sy(1.4))

  // vacuum label when empty
  if (mix < 0.2) {
    drawDiagramLabel(ctx, '真空', sx(1.0), sy(0.1), {
      color: 'rgba(148, 163, 184, 0.85)',
      font: 'bold 14px "Segoe UI", sans-serif',
    })
  }

  // molecules from model
  const px = snap.values.px
  const py = snap.values.py
  const nPart = Number(snap.values.nPart ?? 0)
  if (px instanceof Float32Array && py instanceof Float32Array) {
    for (let i = 0; i < nPart; i++) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.92)'
      ctx.beginPath()
      ctx.arc(sx(px[i]!), sy(py[i]!), 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // partition
  if (mix < 0.95) {
    ctx.strokeStyle = `rgba(248, 113, 113, ${0.95 * (1 - mix)})`
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(sx(0), sy(1.4))
    ctx.lineTo(sx(0), sy(-1.4))
    ctx.stroke()
    drawDiagramLabel(ctx, mix < 0.08 ? '隔板' : '抽走→', sx(0) + 8, sy(1.55), {
      color: 'rgba(248, 113, 113, 0.95)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  }

  // expansion arrow
  if (mix > 0.05 && mix < 0.95) {
    drawArrow(ctx, sx(-0.35), sy(0), sx(0.2 + 1.8 * mix), sy(0), 'rgba(167, 139, 250, 0.9)', 2.5)
    drawDiagramLabel(ctx, '分子向真空扩散', sx(0.4), sy(0.4), {
      color: 'rgba(167, 139, 250, 0.95)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  drawDimLine(ctx, sx(-2.4), sy(-1.55), sx(0), sy(-1.55), `V₁=${V1.toFixed(2)}`, {
    color: 'rgba(56, 189, 248, 0.95)',
    offset: 10,
  })
  drawDimLine(ctx, sx(-2.4), sy(-1.9), sx(2.4), sy(-1.9), `V₂=${V2.toFixed(2)}（终）`, {
    color: 'rgba(251, 191, 36, 0.95)',
    offset: 10,
  })

  // stage callout
  const stageText =
    phase === 0 ? '① 初态：气体只在左室 · 隔板挡住' : phase === 1 ? '② 抽走隔板：向真空自由膨胀' : '③ 终态：铺满两室 · 不可逆'
  const stageColor = phase === 0 ? 'rgba(248, 113, 113, 0.95)' : phase === 1 ? 'rgba(167, 139, 250, 0.95)' : 'rgba(74, 222, 128, 0.95)'
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(sx(-2.35), sy(2.15), sx(2.35) - sx(-2.35), sy(1.55) - sy(2.15))
  drawDiagramLabel(ctx, stageText, sx(-2.25), sy(1.95), {
    color: stageColor,
    font: 'bold 12px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, 'ΔU=0 · Q=W=0 · 但微观态数↑ → ΔS>0', sx(-2.25), sy(1.7), {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })

  // entropy progress
  const barW = Math.min(420, W - 40)
  const frac = dSFinal > 1e-6 ? Math.min(1, dS / dSFinal) : 0
  ctx.fillStyle = 'rgba(30, 41, 59, 0.95)'
  ctx.fillRect(20, H - 40, barW, 16)
  ctx.fillStyle = 'rgba(167, 139, 250, 0.95)'
  ctx.fillRect(20, H - 40, barW * frac, 16)
  ctx.strokeStyle = 'rgba(196, 181, 253, 0.6)'
  ctx.strokeRect(20, H - 40, barW, 16)
  drawDiagramLabel(
    ctx,
    `ΔS = n ln(V₂/V₁) → ${dS.toFixed(3)} / ${dSFinal.toFixed(3)}`,
    28,
    H - 32,
    { color: 'rgba(226, 232, 240, 0.95)', font: '11px "Segoe UI", sans-serif' },
  )

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(560, W - 24), 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(12, 10, Math.min(560, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `自由膨胀 · 混匀 ${(mix * 100).toFixed(0)}% · ΔS=${dS.toFixed(3)}（终 ${dSFinal.toFixed(3)}）`,
    22,
    28,
    { color: 'rgba(196, 181, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '看金点：从左室挤着 → 铺满两室；体积可及空间变大 = 熵增', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
