import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDashedPath,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import { fieldAt, type Charge } from './potential'
import { pickPotentialLevels, traceEquipotentials } from './equipotential2d'

export function potentialWorldBounds(world: number): WorldBounds {
  return {
    xMin: -world,
    xMax: world,
    yMin: -world * 0.75,
    yMax: world * 0.75,
  }
}

function chargeColor(Q: number) {
  if (Q > 0.05) return '#f87171'
  if (Q < -0.05) return '#38bdf8'
  return '#94a3b8'
}

function levelColor(level: number, alpha = 0.85): string {
  // 正电势偏暖青，负电势偏冷青紫
  if (level >= 0) return `rgba(34, 211, 238, ${alpha})`
  return `rgba(129, 140, 248, ${alpha})`
}

export function drawPotentialFrame(
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

  const Q1 = Number(snap.values.Q1 ?? 0)
  const Q2 = Number(snap.values.Q2 ?? 0)
  const d = Number(snap.values.d ?? 2.4)
  const q1x = Number(snap.values.q1x ?? -d / 2)
  const q2x = Number(snap.values.q2x ?? d / 2)
  const K = Number(snap.values.K ?? 1)
  const charges: Charge[] = [
    { x: q1x, y: 0, Q: Q1 },
    { x: q2x, y: 0, Q: Q2 },
  ]

  const levels = pickPotentialLevels(charges, world)
  const contours = traceEquipotentials(charges, world, levels, 58, 44)

  // 等势线
  for (const { level, segs } of contours) {
    ctx.strokeStyle = levelColor(level, 0.78)
    ctx.lineWidth = 1.6
    ctx.beginPath()
    for (const seg of segs) {
      const [a, b] = seg
      if (!a || !b) continue
      ctx.moveTo(sx(a[0]!), sy(a[1]!))
      ctx.lineTo(sx(b[0]!), sy(b[1]!))
    }
    ctx.stroke()
  }

  // 稀疏 E 箭头（强调 ⊥ 等势线）
  const step = 0.95
  for (let y = world.yMin + 0.5; y < world.yMax - 0.3; y += step) {
    for (let x = world.xMin + 0.5; x < world.xMax - 0.3; x += step) {
      let near = false
      for (const c of charges) {
        if (Math.hypot(x - c.x, y - c.y) < 0.55) {
          near = true
          break
        }
      }
      if (near) continue
      const [Ex, Ey] = fieldAt(charges, x, y)
      const Em = Math.hypot(Ex, Ey)
      if (Em < 0.08 || Em > 8) continue
      const len = Math.min(0.38, 0.12 + 0.18 * Math.log1p(Em))
      drawArrow(
        ctx,
        sx(x),
        sy(y),
        sx(x + (Ex / Em) * len),
        sy(y + (Ey / Em) * len),
        'rgba(244, 114, 182, 0.35)',
        1.2,
      )
    }
  }

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(167, 139, 250, 0.65)',
      label: opts.compare.label,
    })
  }

  // 电荷
  for (const c of [
    { ...charges[0]!, label: 'Q₁' },
    { ...charges[1]!, label: 'Q₂' },
  ]) {
    const px = sx(c.x)
    const py = sy(c.y)
    const col = chargeColor(c.Q)
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 18)
    glow.addColorStop(0, col + '99')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(px, py, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(px, py, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0b1220'
    ctx.font = 'bold 12px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(c.Q >= 0 ? '+' : '−', px, py + 0.5)
    drawDiagramLabel(ctx, `${c.label}=${c.Q.toFixed(1)}`, px - 18, py - 22, { color: col })
  }
  drawDimLine(ctx, sx(q1x), sy(0), sx(q2x), sy(0), `d=${d.toFixed(2)}`, { offset: 22 })

  // 等势线数值标签（每条取一段中点）
  for (const { level, segs } of contours) {
    if (segs.length < 4) continue
    const mid = segs[Math.floor(segs.length / 3)]!
    const p = mid[0]!
    drawDiagramLabel(ctx, `V=${level.toFixed(2)}`, sx(p[0]!) + 4, sy(p[1]!) - 4, {
      color: levelColor(level, 0.95),
      font: '10px "Segoe UI", sans-serif',
    })
  }

  // 探测点 + E
  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const V = Number(snap.values.V ?? 0)
  const Ex = Number(snap.values.Ex ?? 0)
  const Ey = Number(snap.values.Ey ?? 0)
  const Emag = Number(snap.values.Emag ?? 0)
  const r1 = Number(snap.values.r1 ?? 1)
  const r2 = Number(snap.values.r2 ?? 1)
  const ppx = sx(x)
  const ppy = sy(y)

  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(ppx, ppy, 6, 0, Math.PI * 2)
  ctx.fill()

  if (Emag > 1e-6) {
    const alen = Math.min(1.1, 0.35 + 0.25 * Math.log1p(Emag))
    drawArrow(
      ctx,
      ppx,
      ppy,
      sx(x + (Ex / Emag) * alen),
      sy(y + (Ey / Emag) * alen),
      'rgba(244, 114, 182, 0.95)',
      2.4,
    )
  }

  // 过探测点的等势线加粗提示
  const probeContours = traceEquipotentials(charges, world, [V], 48, 36)
  for (const { segs } of probeContours) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.lineWidth = 2.2
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    for (const seg of segs) {
      const [a, b] = seg
      if (!a || !b) continue
      ctx.moveTo(sx(a[0]!), sy(a[1]!))
      ctx.lineTo(sx(b[0]!), sy(b[1]!))
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 顶栏公式
  const Vformula = (K * Q1) / Math.max(r1, 1e-6) + (K * Q2) / Math.max(r2, 1e-6)
  const match = Math.abs(Vformula - V) < 0.08
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(640, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxW, 52)
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, 52)
  drawDiagramLabel(ctx, match ? '公式 ↔ 探测点一致 · E ⊥ 等势线' : '公式 ↔ 探测点', boxX + 10, boxY + 18, {
    color: match ? 'rgba(74, 222, 128, 0.95)' : 'rgba(251, 191, 36, 0.95)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `V=kQ₁/r₁+kQ₂/r₂=${Vformula.toFixed(3)}  (读数 V=${V.toFixed(3)})  |E|=${Emag.toFixed(3)}  r₁=${r1.toFixed(2)}  r₂=${r2.toFixed(2)}`,
    boxX + 10,
    boxY + 38,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )

  drawDiagramLabel(
    ctx,
    '青/紫线：等势线 · 粉箭头：E（垂直等势线）· 黄虚线：过探测点的等势线',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
