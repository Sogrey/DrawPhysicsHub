import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import { applyWaveplate, classifyPolarization, fieldAt } from './waveplate'

export function waveplateWorldBounds(world: number): WorldBounds {
  return {
    xMin: -0.2,
    xMax: world + 0.5,
    yMin: -world * 0.48,
    yMax: world * 0.48,
  }
}

function drawDoubleArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleDeg: number,
  halfLen: number,
  color: string,
  width = 2,
): void {
  const th = (angleDeg * Math.PI) / 180
  const ux = Math.cos(th)
  const uy = -Math.sin(th)
  const x0 = x - ux * halfLen
  const y0 = y - uy * halfLen
  const x1 = x + ux * halfLen
  const y1 = y + uy * halfLen
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  const ah = Math.max(5, halfLen * 0.22)
  for (const [bx, by, dir] of [
    [x1, y1, 1],
    [x0, y0, -1],
  ] as const) {
    const dx = ux * dir
    const dy = uy * dir
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.lineTo(bx - dx * ah - dy * ah * 0.45, by - dy * ah + dx * ah * 0.45)
    ctx.lineTo(bx - dx * ah + dy * ah * 0.45, by - dy * ah - dx * ah * 0.45)
    ctx.closePath()
    ctx.fill()
  }
}

function kindLabel(kindCode: number, dphi: number): string {
  if (kindCode === 0) return '线偏振'
  if (kindCode === 2) return dphi >= 0 ? '左旋圆偏振' : '右旋圆偏振'
  return '椭圆偏振'
}

function tipForState(kindCode: number, alpha: number, beta: number, delta: number): string {
  const rel = Math.abs((((alpha - beta) % 180) + 180) % 180)
  const near45 = Math.abs(rel - 45) < 8 || Math.abs(rel - 135) < 8
  if (Math.abs(delta - 90) < 2 && near45 && kindCode === 2) {
    return '关键：α 与快轴差 45° + 1/4 波片 → 等幅且 Δφ=90° → 圆'
  }
  if (Math.abs(delta - 180) < 2 && kindCode === 0) {
    return '半波片：仍是线偏光，偏振面转到 α′=2β−α'
  }
  if (kindCode === 0) return '判定：两分量同相（Δφ≈0°/180°）→ 线偏振'
  if (kindCode === 2) return '判定：Ax≈Ay 且 |Δφ|≈90° → 圆偏振'
  return '判定：振幅不等或位相不是 0/90° → 椭圆偏振'
}

function drawStepBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  n: string,
  title: string,
): void {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
  ctx.lineWidth = 1
  const w = 86
  const h = 22
  ctx.beginPath()
  ctx.roundRect?.(x, y, w, h, 6)
  if (!ctx.roundRect) {
    ctx.rect(x, y, w, h)
  }
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = 'rgba(167, 139, 250, 0.98)'
  ctx.font = 'bold 11px "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`${n} ${title}`, x + 8, y + 15)
}

export function drawWaveplateFrame(
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

  const alpha = Number(snap.values.alpha ?? 45)
  const beta = Number(snap.values.beta ?? 0)
  const delta = Number(snap.values.delta ?? 90)
  const Ex = Number(snap.values.Ex ?? 0)
  const Ey = Number(snap.values.Ey ?? 0)
  const kindCode = Number(snap.values.kindCode ?? 1)
  const dphi = Number(snap.values.dphi ?? 0)
  const Ax = Number(snap.values.Ax ?? 0)
  const Ay = Number(snap.values.Ay ?? 0)
  const t = Number(snap.time ?? 0)
  const period = Number(snap.values.period ?? 4)
  const omegaT = (2 * Math.PI * t) / Math.max(period, 1e-9)

  const cy = sy(0)
  const xIn = 1.05
  const xPlate = 2.85
  const xOut = 5.05
  const rDisk = Math.min(62, Math.abs(sy(-1) - sy(1)) * 0.36)
  const orbitR = Math.min(78, Math.abs(sy(-1.15) - sy(1.15)) * 0.4)

  const { jx, jy } = applyWaveplate(alpha, beta, delta)
  const pol = classifyPolarization(jx, jy)

  // 入射在快/慢轴上的分解振幅（β 坐标系）
  const aRad = ((alpha - beta) * Math.PI) / 180
  const Af = Math.cos(aRad) // 沿快轴
  const As = Math.sin(aRad) // 沿慢轴
  // 慢轴已延迟 δ：瞬时快/慢分量（教学示意）
  const Ef = Af * Math.cos(omegaT)
  const Es = As * Math.cos(omegaT - (delta * Math.PI) / 180)

  // ========== ① 入射 ==========
  drawStepBadge(ctx, sx(0.15), cy - rDisk - 48, '①', '入射')
  // 水平参考虚线
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(sx(xIn) - 40, cy)
  ctx.lineTo(sx(xIn) + 40, cy)
  ctx.stroke()
  ctx.setLineDash([])
  drawDoubleArrow(ctx, sx(xIn), cy, alpha, 36, 'rgba(74, 222, 128, 0.98)', 2.6)
  // α 角弧
  if (Math.abs(alpha) > 4) {
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.85)'
    ctx.lineWidth = 1.5
    const a0 = 0
    const a1 = (-alpha * Math.PI) / 180
    ctx.beginPath()
    ctx.arc(sx(xIn), cy, 22, Math.min(a0, a1), Math.max(a0, a1))
    ctx.stroke()
  }
  drawDiagramLabel(ctx, `线偏光`, sx(xIn) - 22, cy - 52, {
    color: 'rgba(74, 222, 128, 0.95)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, `α=${alpha.toFixed(0)}°（相对 x）`, sx(xIn) - 36, cy + 58, {
    color: 'rgba(148, 163, 184, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // 箭头指向波片
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx(xIn) + 48, cy)
  ctx.lineTo(sx(xPlate) - rDisk - 10, cy)
  ctx.stroke()

  // ========== ② 波片：分解到快/慢 ==========
  drawStepBadge(ctx, sx(xPlate) - 44, cy - rDisk - 48, '②', '波片分解')
  ctx.save()
  ctx.translate(sx(xPlate), cy)
  ctx.fillStyle = 'rgba(167, 139, 250, 0.22)'
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.95)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(0, 0, rDisk, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  const thB = (beta * Math.PI) / 180
  const fux = Math.cos(thB)
  const fuy = -Math.sin(thB)
  const sux = -fuy
  const suy = fux

  // 快/慢轴线
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
  ctx.lineWidth = 1.4
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(-fux * rDisk * 0.92, -fuy * rDisk * 0.92)
  ctx.lineTo(fux * rDisk * 0.92, fuy * rDisk * 0.92)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.55)'
  ctx.beginPath()
  ctx.moveTo(-sux * rDisk * 0.92, -suy * rDisk * 0.92)
  ctx.lineTo(sux * rDisk * 0.92, suy * rDisk * 0.92)
  ctx.stroke()
  ctx.setLineDash([])

  // 分量双箭头（长度∝振幅，瞬时可见）
  const halfF = 10 + 22 * Math.abs(Af)
  const halfS = 10 + 22 * Math.abs(As)
  drawDoubleArrow(ctx, 0, 0, beta, halfF * (0.35 + 0.65 * Math.abs(Ef) / Math.max(Math.abs(Af), 0.15)), 'rgba(251, 191, 36, 0.98)', 2.2)
  drawDoubleArrow(
    ctx,
    0,
    0,
    beta + 90,
    halfS * (0.35 + 0.65 * Math.abs(Es) / Math.max(Math.abs(As), 0.15)),
    'rgba(244, 114, 182, 0.98)',
    2.2,
  )

  ctx.fillStyle = 'rgba(251, 191, 36, 0.98)'
  ctx.font = 'bold 12px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('快', fux * (rDisk + 14), fuy * (rDisk + 14) + 4)
  ctx.fillStyle = 'rgba(244, 114, 182, 0.98)'
  ctx.fillText('慢', sux * (rDisk + 14), suy * (rDisk + 14) + 4)

  ctx.fillStyle = 'rgba(226, 232, 240, 0.98)'
  ctx.font = '12px "Segoe UI", sans-serif'
  const plateName =
    Math.abs(delta - 90) < 1 ? '1/4 波片' : Math.abs(delta - 180) < 1 ? '1/2 波片' : '波片'
  ctx.fillText(plateName, 0, rDisk + 22)
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillStyle = 'rgba(196, 181, 253, 0.95)'
  ctx.fillText(`慢轴多延迟 δ=${delta.toFixed(0)}°`, 0, rDisk + 38)
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.fillText(`Af=${Af.toFixed(2)}  As=${As.toFixed(2)}`, 0, rDisk + 52)
  ctx.restore()

  // 箭头指向出射
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx(xPlate) + rDisk + 8, cy)
  ctx.lineTo(sx(xOut) - orbitR - 12, cy)
  ctx.stroke()

  // ========== ③ 合成矢端 ==========
  drawStepBadge(ctx, sx(xOut) - 44, cy - orbitR - 48, '③', '合成轨迹')
  const ocx = sx(xOut)
  const ocy = cy

  // 面板底
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)'
  ctx.beginPath()
  ctx.arc(ocx, ocy, orbitR + 8, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(ocx - orbitR - 6, ocy)
  ctx.lineTo(ocx + orbitR + 6, ocy)
  ctx.moveTo(ocx, ocy - orbitR - 6)
  ctx.lineTo(ocx, ocy + orbitR + 6)
  ctx.stroke()
  ctx.fillStyle = 'rgba(148, 163, 184, 0.75)'
  ctx.font = '10px "Segoe UI", sans-serif'
  ctx.fillText('Ex', ocx + orbitR + 8, ocy + 3)
  ctx.fillText('Ey', ocx + 4, ocy - orbitR - 8)

  // Ex / Ey 瞬时分量短杠（贴在 ③ 面板外侧，避免伸进波片区）
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(ocx, ocy + orbitR + 14)
  ctx.lineTo(ocx + Ex * orbitR * 0.92, ocy + orbitR + 14)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)'
  ctx.beginPath()
  ctx.moveTo(ocx + orbitR + 14, ocy)
  ctx.lineTo(ocx + orbitR + 14, ocy - Ey * orbitR * 0.92)
  ctx.stroke()
  drawDiagramLabel(ctx, 'Ex(t)', ocx - 8, ocy + orbitR + 28, {
    color: 'rgba(56, 189, 248, 0.9)',
    font: '10px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, 'Ey(t)', ocx + orbitR + 18, ocy - 4, {
    color: 'rgba(74, 222, 128, 0.9)',
    font: '10px "Segoe UI", sans-serif',
  })

  // 完整轨迹（淡）
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  const N = 96
  for (let i = 0; i <= N; i++) {
    const wt = (2 * Math.PI * i) / N
    const f = fieldAt(jx, jy, wt)
    const px = ocx + f.ex * orbitR
    const py = ocy - f.ey * orbitR
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // 形成过程：已扫过的亮迹
  const frac = Math.min(1, t / Math.max(period, 1e-9))
  const nShow = Math.max(2, Math.floor(N * Math.max(frac, 0.02)))
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.98)'
  ctx.lineWidth = 2.6
  ctx.beginPath()
  for (let i = 0; i <= nShow; i++) {
    const wt = (2 * Math.PI * i) / N
    const f = fieldAt(jx, jy, wt)
    const px = ocx + f.ex * orbitR
    const py = ocy - f.ey * orbitR
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // 瞬时 E
  const tipX = ocx + Ex * orbitR
  const tipY = ocy - Ey * orbitR
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.98)'
  ctx.fillStyle = 'rgba(167, 139, 250, 0.98)'
  ctx.lineWidth = 2.8
  ctx.beginPath()
  ctx.moveTo(ocx, ocy)
  ctx.lineTo(tipX, tipY)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(tipX, tipY, 5.5, 0, Math.PI * 2)
  ctx.fill()
  drawDiagramLabel(ctx, 'E(t)', tipX + 8, tipY - 6, {
    color: 'rgba(167, 139, 250, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // 圆偏振：旋向弧箭头
  if (kindCode === 2) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.lineWidth = 2
    const sense = dphi >= 0 ? 1 : -1
    ctx.beginPath()
    ctx.arc(ocx, ocy, orbitR * 0.72, -0.4, 1.2, sense < 0)
    ctx.stroke()
    drawDiagramLabel(ctx, sense > 0 ? '旋向 ↺' : '旋向 ↻', ocx + 8, ocy - orbitR * 0.55, {
      color: 'rgba(251, 191, 36, 0.95)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  drawDiagramLabel(ctx, kindLabel(kindCode, dphi), ocx - 40, ocy + orbitR + 48, {
    color: 'rgba(226, 232, 240, 0.98)',
    font: 'bold 14px "Segoe UI", sans-serif',
  })

  // ========== 顶栏状态 ==========
  const boxX = 12
  const boxY = 8
  const boxW = Math.min(560, W - 24)
  const boxH = 52
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxW, boxH)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, boxH)
  drawDiagramLabel(
    ctx,
    `${kindLabel(kindCode, dphi)}　Ax=${Ax.toFixed(2)}  Ay=${Ay.toFixed(2)}  Δφ=${dphi.toFixed(0)}°  ε=${pol.ellipticity.toFixed(2)}`,
    boxX + 10,
    boxY + 18,
    { color: 'rgba(196, 181, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, tipForState(kindCode, alpha, beta, delta), boxX + 10, boxY + 38, {
    color: 'rgba(226, 232, 240, 0.92)',
    font: '11px "Segoe UI", sans-serif',
  })

  // ========== 底栏口诀 ==========
  const ruleY = H - 28
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.fillRect(12, ruleY - 6, Math.min(620, W - 24), 26)
  drawDiagramLabel(
    ctx,
    '口诀：同相 → 线　|　等幅 + Δφ=±90° → 圆　|　其余 → 椭圆　　播放=扫一个周期画出轨迹',
    20,
    ruleY + 12,
    { color: 'rgba(148, 163, 184, 0.95)', font: '11px "Segoe UI", sans-serif' },
  )
}
