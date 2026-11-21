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
    xMin: -0.3,
    xMax: world + 0.4,
    yMin: -world * 0.42,
    yMax: world * 0.42,
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
  const ah = 6
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

function drawWaveplateDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  betaDeg: number,
  deltaDeg: number,
): void {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = 'rgba(167, 139, 250, 0.28)'
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.95)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // 快轴（金）/ 慢轴（粉）— 正交
  const th = (betaDeg * Math.PI) / 180
  const fx = Math.cos(th)
  const fy = -Math.sin(th)
  const sx = -fy
  const sy = fx

  const drawAxis = (ux: number, uy: number, color: string, label: string, side: number) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(-ux * r * 0.88, -uy * r * 0.88)
    ctx.lineTo(ux * r * 0.88, uy * r * 0.88)
    ctx.stroke()
    ctx.font = '11px "Segoe UI", sans-serif'
    ctx.fillText(label, ux * r * 0.55 + sx * side * 10, uy * r * 0.55 + sy * side * 10)
  }
  drawAxis(fx, fy, 'rgba(251, 191, 36, 0.95)', '快', 1)
  drawAxis(sx, sy, 'rgba(244, 114, 182, 0.95)', '慢', -1)

  ctx.fillStyle = 'rgba(226, 232, 240, 0.98)'
  ctx.font = '13px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  const plateName =
    Math.abs(deltaDeg - 90) < 1 ? '1/4 波片' : Math.abs(deltaDeg - 180) < 1 ? '1/2 波片' : '波片'
  ctx.fillText(plateName, 0, r + 20)
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillStyle = 'rgba(167, 139, 250, 0.95)'
  ctx.fillText(`β=${betaDeg.toFixed(0)}°  δ=${deltaDeg.toFixed(0)}°`, 0, r + 36)
  ctx.restore()
}

function drawLinearSegment(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  cy: number,
  alphaDeg: number,
): void {
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.85)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(x0, cy)
  ctx.lineTo(x1, cy)
  ctx.stroke()
  const n = 4
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n
    drawDoubleArrow(ctx, x, cy, alphaDeg, 18, 'rgba(74, 222, 128, 0.95)', 1.9)
  }
}

function kindLabel(kindCode: number, dphi: number): string {
  if (kindCode === 0) return '线偏振'
  if (kindCode === 2) return dphi >= 0 ? '左旋圆偏振' : '右旋圆偏振'
  return '椭圆偏振'
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

  const cy = sy(0)
  const xIn0 = 0.35
  const xPlate = 2.2
  const xOut = 4.6
  const rDisk = Math.min(58, Math.abs(sy(-0.9) - sy(0.9)) * 0.4)
  const orbitR = Math.min(70, Math.abs(sy(-1.1) - sy(1.1)) * 0.42)

  // —— 入射 ——
  drawLinearSegment(ctx, sx(xIn0), sx(xPlate) - rDisk - 8, cy, alpha)
  drawDiagramLabel(ctx, `线偏光 α=${alpha.toFixed(0)}°`, sx(xIn0), cy - 42, {
    color: 'rgba(74, 222, 128, 0.95)',
  })

  // —— 波片 ——
  drawWaveplateDisk(ctx, sx(xPlate), cy, rDisk, beta, delta)

  // —— 出射光束轴 ——
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx(xPlate) + rDisk + 6, cy)
  ctx.lineTo(sx(xOut) - orbitR - 10, cy)
  ctx.stroke()

  // —— 偏振椭圆（矢端轨迹）——
  const { jx, jy } = applyWaveplate(alpha, beta, delta)
  const pol = classifyPolarization(jx, jy)
  const ocx = sx(xOut)
  const ocy = cy

  ctx.save()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(ocx, ocy, orbitR, 0, Math.PI * 2)
  ctx.stroke()
  // axes of viewing plane
  ctx.beginPath()
  ctx.moveTo(ocx - orbitR - 4, ocy)
  ctx.lineTo(ocx + orbitR + 4, ocy)
  ctx.moveTo(ocx, ocy - orbitR - 4)
  ctx.lineTo(ocx, ocy + orbitR + 4)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)'
  ctx.lineWidth = 2.4
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

  // progress arc of formation (partial trail up to t)
  const frac = Math.min(1, t / Math.max(period, 1e-9))
  if (frac > 0.02 && frac < 0.98) {
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
    ctx.lineWidth = 3
    ctx.beginPath()
    const nShow = Math.max(2, Math.floor(N * frac))
    for (let i = 0; i <= nShow; i++) {
      const wt = (2 * Math.PI * i) / N
      const f = fieldAt(jx, jy, wt)
      const px = ocx + f.ex * orbitR
      const py = ocy - f.ey * orbitR
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  // instantaneous E
  const tipX = ocx + Ex * orbitR
  const tipY = ocy - Ey * orbitR
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.98)'
  ctx.fillStyle = 'rgba(167, 139, 250, 0.98)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(ocx, ocy)
  ctx.lineTo(tipX, tipY)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(tipX, tipY, 5, 0, Math.PI * 2)
  ctx.fill()

  drawDiagramLabel(ctx, '矢端轨迹', ocx - 28, ocy - orbitR - 18, {
    color: 'rgba(56, 189, 248, 0.95)',
  })
  drawDiagramLabel(ctx, kindLabel(kindCode, dphi), ocx - 36, ocy + orbitR + 22, {
    color: 'rgba(226, 232, 240, 0.95)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  ctx.restore()

  // 状态条：屏幕坐标贴顶，避免被 y 轴/视口裁切遮挡
  const status = `${kindLabel(kindCode, dphi)} · Ax=${Ax.toFixed(2)}  Ay=${Ay.toFixed(2)}  Δφ=${dphi.toFixed(0)}°`
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(480, W - 24)
  const boxH = 44
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
  ctx.fillRect(boxX, boxY, boxW, boxH)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, boxH)
  drawDiagramLabel(ctx, status, boxX + 10, boxY + 16, {
    color: 'rgba(196, 181, 253, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `ε=${pol.ellipticity.toFixed(2)}   播放：扫一个光周期画出轨迹`,
    boxX + 10,
    boxY + 34,
    { color: 'rgba(226, 232, 240, 0.88)', font: '11px "Segoe UI", sans-serif' },
  )
}
