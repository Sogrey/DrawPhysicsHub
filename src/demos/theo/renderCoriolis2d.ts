import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDashedPath,
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function coriolisWorldBounds(world: number): WorldBounds {
  return { xMin: -world, xMax: world, yMin: -world, yMax: world }
}

export function drawCoriolisFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
  opts?: { compare?: CompareTrail | null },
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })
  const map = { sx, sy }

  const Omega = Number(snap.values.Omega ?? 0.9)
  const t = Number(snap.time ?? 0)
  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const r = Number(snap.values.r ?? Math.hypot(x, y))
  const vx = Number(snap.values.vx ?? 0)
  const vy = Number(snap.values.vy ?? 0)
  const acx = Number(snap.values.acx ?? 0)
  const acy = Number(snap.values.acy ?? 0)
  const afx = Number(snap.values.afx ?? 0)
  const afy = Number(snap.values.afy ?? 0)
  const withCf = Number(snap.values.withCf ?? 0) > 0.5
  const acmag = Number(snap.values.acmag ?? 0)
  const Rdisk = Number(snap.values.diskR ?? 3.2)
  const sense = Omega >= 0 ? 1 : -1

  // 转盘
  ctx.fillStyle = 'rgba(71, 85, 105, 0.35)'
  ctx.beginPath()
  ctx.arc(sx(0), sy(0), Math.abs(sx(Rdisk) - sx(0)), 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.lineWidth = 2
  ctx.stroke()

  const rot = sense * Omega * t
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
  ctx.lineWidth = 1.1
  for (let k = 0; k < 8; k++) {
    const th = rot + (k * Math.PI) / 4
    ctx.beginPath()
    ctx.moveTo(sx(0.25 * Math.cos(th)), sy(0.25 * Math.sin(th)))
    ctx.lineTo(sx(Rdisk * Math.cos(th)), sy(Rdisk * Math.sin(th)))
    ctx.stroke()
  }
  const th0 = rot + 0.35
  const th1 = rot + 1.05
  drawArrow(
    ctx,
    sx(Rdisk * 0.78 * Math.cos(th0)),
    sy(Rdisk * 0.78 * Math.sin(th0)),
    sx(Rdisk * 0.78 * Math.cos(th1)),
    sy(Rdisk * 0.78 * Math.sin(th1)),
    'rgba(148, 163, 184, 0.95)',
    2.2,
  )

  // 中心 Ω 出/入纸面记号
  const ox = sx(0)
  const oy = sy(0)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.beginPath()
  ctx.arc(ox, oy, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.95)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(ox, oy, 14, 0, Math.PI * 2)
  ctx.stroke()
  if (sense > 0) {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.95)'
    ctx.beginPath()
    ctx.arc(ox, oy, 4.5, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(ox - 6, oy - 6)
    ctx.lineTo(ox + 6, oy + 6)
    ctx.moveTo(ox + 6, oy - 6)
    ctx.lineTo(ox - 6, oy + 6)
    ctx.stroke()
  }
  drawDiagramLabel(ctx, `Ω ${sense > 0 ? '⊙ 出纸面' : '⊗ 入纸面'}`, ox + 20, oy - 6, {
    color: 'rgba(226, 232, 240, 0.95)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })

  // 半径辅助
  if (r > 0.15) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(sx(0), sy(0))
    ctx.lineTo(sx(x), sy(y))
    ctx.stroke()
    ctx.setLineDash([])
    drawDiagramLabel(ctx, `r=${r.toFixed(2)}`, sx(x * 0.45) + 4, sy(y * 0.45) - 8, {
      color: 'rgba(125, 211, 252, 0.9)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  // 轨迹
  const path = snap.trails?.path
  if (path && path.length > 1) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
  }

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(167, 139, 250, 0.75)',
      label: opts.compare.label,
    })
  }

  // 质点
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(sx(x), sy(y), 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  const sp = Math.hypot(vx, vy)
  let vTipX = x
  let vTipY = y
  let vLen = 0
  if (sp > 0.05) {
    vLen = Math.min(1.45, 0.55 + 0.28 * sp)
    vTipX = x + (vx / sp) * vLen
    vTipY = y + (vy / sp) * vLen
    drawArrow(ctx, sx(x), sy(y), sx(vTipX), sy(vTipY), 'rgba(74, 222, 128, 0.98)', 2.6)
    drawDiagramLabel(ctx, 'v', sx(vTipX) + 6, sy(vTipY) - 4, {
      color: 'rgba(74, 222, 128, 0.98)',
      font: 'bold 13px "Segoe UI", sans-serif',
    })
  }

  let cTipX = x
  let cTipY = y
  let cLen = 0
  if (acmag > 0.05) {
    cLen = Math.min(1.55, 0.5 + 0.22 * acmag)
    cTipX = x + (acx / acmag) * cLen
    cTipY = y + (acy / acmag) * cLen
    drawArrow(ctx, sx(x), sy(y), sx(cTipX), sy(cTipY), 'rgba(244, 114, 182, 0.98)', 2.8)
    drawDiagramLabel(ctx, 'a_cor', sx(cTipX) + 6, sy(cTipY) + 12, {
      color: 'rgba(244, 114, 182, 0.98)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  }

  // a_cor ⊥ v 直角标记
  if (sp > 0.05 && acmag > 0.05) {
    const ux = vx / sp
    const uy = vy / sp
    const cxu = acx / acmag
    const cyu = acy / acmag
    const s = 0.38
    const p1x = x + ux * s
    const p1y = y + uy * s
    const p2x = x + ux * s + cxu * s
    const p2y = y + uy * s + cyu * s
    const p3x = x + cxu * s
    const p3y = y + cyu * s
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(sx(p1x), sy(p1y))
    ctx.lineTo(sx(p2x), sy(p2y))
    ctx.lineTo(sx(p3x), sy(p3y))
    ctx.stroke()
    drawDiagramLabel(ctx, '⊥', sx(p2x) + 4, sy(p2y) - 2, {
      color: 'rgba(251, 191, 36, 0.95)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  }

  const afmag = Math.hypot(afx, afy)
  if (withCf && afmag > 0.05) {
    const len = Math.min(1.25, 0.4 + 0.22 * afmag)
    const tipX = x + (afx / afmag) * len
    const tipY = y + (afy / afmag) * len
    drawArrow(ctx, sx(x), sy(y), sx(tipX), sy(tipY), 'rgba(56, 189, 248, 0.95)', 2.2)
    drawDiagramLabel(ctx, 'a_cf', sx(tipX) + 6, sy(tipY) - 6, {
      color: 'rgba(56, 189, 248, 0.95)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  }

  const boxX = 12
  const boxY = 10
  const boxW = Math.min(640, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(boxX, boxY, boxW, 54)
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, 54)
  drawDiagramLabel(ctx, '转系俯视 · a_cor=−2Ω×v ⊥ v · 黄线=路径', boxX + 10, boxY + 18, {
    color: 'rgba(244, 114, 182, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `|a_cor|=${acmag.toFixed(2)}  v=(${vx.toFixed(2)},${vy.toFixed(2)})  离心${withCf ? '开' : '关(推荐先关)'}  Ω=${Omega.toFixed(2)}`,
    boxX + 10,
    boxY + 38,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )

  drawDiagramLabel(
    ctx,
    '中心⊙=Ω · 绿=v · 粉=a_cor · 青=a_cf · 直角标=垂直 · 紫虚线=初速方向',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.92)', font: '11px "Segoe UI", sans-serif' },
  )
}
