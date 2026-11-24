import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawAngleMark,
  drawArrow,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function comptonWorldBounds(): WorldBounds {
  return { xMin: -3.2, xMax: 3.8, yMin: -2.8, yMax: 3.2 }
}

function drawWavyPhoton(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  wavelengthPx: number,
  color: string,
  alpha = 1,
) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux
  const amp = 7
  const waves = Math.max(2, Math.round(len / Math.max(8, wavelengthPx)))
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = 2.2
  ctx.beginPath()
  for (let i = 0; i <= 56; i++) {
    const t = i / 56
    const along = t * len
    const px = x0 + ux * along + nx * amp * Math.sin(t * waves * Math.PI * 2)
    const py = y0 + uy * along + ny * amp * Math.sin(t * waves * Math.PI * 2)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  drawArrow(ctx, x0 + ux * (len - 14), y0 + uy * (len - 14), x1, y1, color, 2.2)
  ctx.restore()
}

export function drawComptonFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const th = Number(snap.values.th ?? 0)
  const u = Number(snap.values.u ?? 0)
  const thetaDeg = Number(snap.values.theta ?? 0)
  const lambda = Number(snap.values.lambda ?? 2)
  const lambdaP = Number(snap.values.lambdaP ?? 2)
  const dLambda = Number(snap.values.dLambda ?? 0)
  const t = Number(snap.time ?? 0)
  const period = Number(snap.values.period ?? 6)

  // 三阶段：接近 → 碰撞 → 散射+反冲
  const stage = u < 0.28 ? 0 : u < 0.42 ? 1 : 2
  const approach = Math.min(1, u / 0.28)

  drawMarker(ctx, sx(0), sy(0), { radius: 10, fill: '#f472b6', label: '静止 e⁻', labelDx: -22, labelDy: 18 })

  // incident photon (moves in during stage 0)
  const inLen = 2.5
  const inTip = -0.25
  const inStart = -inLen + (1 - approach) * 1.2
  const inEnd = inTip - (1 - approach) * 0.8
  const inAlpha = stage === 2 ? 0.25 : 1
  drawWavyPhoton(
    ctx,
    sx(inStart),
    sy(0),
    sx(Math.min(inEnd, inTip)),
    sy(0),
    26 / Math.max(0.5, lambda),
    'rgba(56, 189, 248, 0.95)',
    inAlpha,
  )
  drawDiagramLabel(ctx, `入射 λ=${lambda.toFixed(2)}（波密=能量高）`, sx(-2.5), sy(0.5), {
    color: 'rgba(56, 189, 248, 0.95)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })

  // collision flash
  if (stage === 1) {
    const flash = 0.4 + 0.6 * Math.abs(Math.sin(t * 20))
    ctx.fillStyle = `rgba(253, 224, 71, ${0.35 * flash})`
    ctx.beginPath()
    ctx.arc(sx(0), sy(0), 28 + 10 * flash, 0, Math.PI * 2)
    ctx.fill()
    drawDiagramLabel(ctx, '碰撞：光子把部分能量给电子', sx(0.3), sy(1.1), {
      color: 'rgba(253, 224, 71, 0.98)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  }

  // scattered photon (appears after collision)
  if (stage >= 1) {
    const L = 2.3 * (stage === 1 ? 0.35 : Math.min(1, (u - 0.35) / 0.45))
    const sx1 = sx(L * Math.cos(th))
    const sy1 = sy(L * Math.sin(th))
    drawWavyPhoton(
      ctx,
      sx(0.2),
      sy(0),
      sx1,
      sy1,
      26 / Math.max(0.5, lambdaP),
      'rgba(251, 191, 36, 0.95)',
      stage === 1 ? 0.6 : 1,
    )
    if (stage === 2) {
      drawDiagramLabel(ctx, `散射 λ'=${lambdaP.toFixed(2)}（波疏=能量低）`, sx1 + 4, sy1 - 10, {
        color: 'rgba(251, 191, 36, 0.95)',
        font: 'bold 12px "Segoe UI", sans-serif',
      })
    }
  }

  drawAngleMark(ctx, sx(0), sy(0), 36, 0, -th, `θ=${thetaDeg.toFixed(0)}°`, {
    color: 'rgba(167, 139, 250, 0.95)',
    labelDistance: 52,
  })

  // recoil electron — length ∝ energy taken from photon ∝ Δλ
  if (stage >= 1) {
    const er = 1.35 * Math.min(1.25, 0.3 + dLambda)
    const eAng = -th * 0.45
    const eProg = stage === 1 ? 0.25 : Math.min(1, (u - 0.35) / 0.5)
    const ex = er * Math.cos(eAng) * eProg
    const ey = er * Math.sin(eAng) * eProg
    drawArrow(ctx, sx(0), sy(0), sx(ex), sy(ey), 'rgba(244, 114, 182, 0.95)', 2.8)
    drawDiagramLabel(ctx, `反冲 e⁻（动能∝Δλ）`, sx(ex) + 6, sy(ey) + 14, {
      color: 'rgba(244, 114, 182, 0.95)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  drawDimLine(ctx, sx(-2.2), sy(-2.15), sx(-0.3), sy(-2.15), `Δλ=${dLambda.toFixed(3)}=λc(1−cosθ)`, {
    color: 'rgba(167, 139, 250, 0.95)',
    offset: 0,
  })

  // ===== λ vs λ' 对比尺（解释“箭头变长/波长变长”的原因）=====
  const boxX = W - 230
  const boxY = H - 168
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)'
  ctx.fillRect(boxX, boxY, 210, 148)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
  ctx.strokeRect(boxX, boxY, 210, 148)
  drawDiagramLabel(ctx, '为何 λ 变长？', boxX + 10, boxY + 18, {
    color: 'rgba(253, 230, 138, 0.98)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '① 光子撞电子 → 失能', boxX + 10, boxY + 38, {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '② E=hc/λ ↓ → λ↑', boxX + 10, boxY + 56, {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '③ 失能 = 电子反冲动能', boxX + 10, boxY + 74, {
    color: 'rgba(244, 114, 182, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // wavelength bars
  const maxL = Math.max(lambdaP, lambda, 1) * 1.15
  const barL = boxX + 48
  const barW = 140
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
  ctx.fillRect(barL, boxY + 92, barW, 10)
  ctx.fillStyle = '#38bdf8'
  ctx.fillRect(barL, boxY + 92, barW * (lambda / maxL), 10)
  drawDiagramLabel(ctx, 'λ', boxX + 12, boxY + 100, { color: '#38bdf8', font: '11px "Segoe UI", sans-serif' })

  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
  ctx.fillRect(barL, boxY + 112, barW, 10)
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(barL, boxY + 112, barW * (lambdaP / maxL), 10)
  drawDiagramLabel(ctx, "λ'", boxX + 12, boxY + 120, { color: '#fbbf24', font: '11px "Segoe UI", sans-serif' })

  drawDiagramLabel(ctx, `金条更长 = 波长增加 ${dLambda.toFixed(2)}`, boxX + 10, boxY + 140, {
    color: 'rgba(167, 139, 250, 0.95)',
    font: '10px "Segoe UI", sans-serif',
  })

  // stage banner
  const stageTxt =
    stage === 0 ? '① 入射光子靠近' : stage === 1 ? '② 碰撞瞬间 · 能量转移' : '③ 散射光子(λ↑) + 反冲电子'
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(580, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
  ctx.strokeRect(12, 10, Math.min(580, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `康普顿 · θ=${thetaDeg.toFixed(0)}° · Δλ=${dLambda.toFixed(3)} · ${stageTxt}`,
    22,
    28,
    { color: 'rgba(253, 230, 138, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '粉箭头变长 = 电子带走更多动能 = 光子失能更多 = λ\'更长（θ↑时更明显）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })

  void period
}
