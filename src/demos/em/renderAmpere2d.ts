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
import { ampereForce } from './ampere'

export function ampereWorldBounds(world: number): WorldBounds {
  return {
    xMin: -world * 0.85,
    xMax: world * 0.85,
    yMin: -world * 0.7,
    yMax: world * 0.7,
  }
}

function drawBFieldMarks(
  ctx: CanvasRenderingContext2D,
  world: WorldBounds,
  sx: (x: number) => number,
  sy: (y: number) => number,
  outOfPage: boolean,
): void {
  const step = Math.max(0.85, (world.xMax - world.xMin) / 9)
  ctx.save()
  for (let x = Math.ceil(world.xMin / step) * step; x <= world.xMax; x += step) {
    for (let y = Math.ceil(world.yMin / step) * step; y <= world.yMax; y += step) {
      const px = sx(x)
      const py = sy(y)
      if (outOfPage) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = 'rgba(148, 163, 184, 0.65)'
        ctx.beginPath()
        ctx.arc(px, py, 1.7, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        const s = 4
        ctx.beginPath()
        ctx.moveTo(px - s, py - s)
        ctx.lineTo(px + s, py + s)
        ctx.moveTo(px + s, py - s)
        ctx.lineTo(px - s, py + s)
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}

export function drawAmpereFrame(
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

  const I = Number(snap.values.I ?? 0)
  const L = Number(snap.values.L ?? 2.4)
  const B = Number(snap.values.B ?? 1.2)
  const alpha = Number(snap.values.alpha ?? 0)
  const Fx = Number(snap.values.Fx ?? 0)
  const Fy = Number(snap.values.Fy ?? 0)
  const Fmag = Number(snap.values.Fmag ?? 0)
  const Bout = Number(snap.values.Bout ?? 1) >= 0.5
  const cx = Number(snap.values.cx ?? 0)
  const cy = Number(snap.values.cy ?? 0)
  const lx = Number(snap.values.lx ?? Math.cos((alpha * Math.PI) / 180))
  const ly = Number(snap.values.ly ?? Math.sin((alpha * Math.PI) / 180))

  drawBFieldMarks(ctx, world, sx, sy, Bout)
  drawDiagramLabel(ctx, Bout ? 'B 出纸面 ·' : 'B 入纸面 ×', sx(world.xMin) + 12, sy(world.yMax) + 28, {
    color: 'rgba(148, 163, 184, 0.95)',
  })

  // 导线
  const half = L / 2
  const x0 = cx - lx * half
  const y0 = cy - ly * half
  const x1 = cx + lx * half
  const y1 = cy + ly * half

  ctx.strokeStyle = 'rgba(74, 222, 128, 0.95)'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(y0))
  ctx.lineTo(sx(x1), sy(y1))
  ctx.stroke()

  // 电流方向（沿导线；I<0 反向）
  const idir = I >= 0 ? 1 : -1
  const imx = cx - lx * half * 0.15 * idir
  const imy = cy - ly * half * 0.15 * idir
  const itx = cx + lx * half * 0.55 * idir
  const ity = cy + ly * half * 0.55 * idir
  if (Math.abs(I) > 0.05) {
    drawArrow(ctx, sx(imx), sy(imy), sx(itx), sy(ity), 'rgba(74, 222, 128, 0.95)', 2.6)
    drawDiagramLabel(ctx, `I=${I.toFixed(2)} A`, sx(itx) + 8, sy(ity) - 10, {
      color: 'rgba(74, 222, 128, 0.95)',
    })
  } else {
    drawDiagramLabel(ctx, 'I≈0', sx(cx) + 8, sy(cy) - 14, {
      color: 'rgba(148, 163, 184, 0.9)',
    })
  }

  drawDimLine(ctx, sx(x0), sy(y0), sx(x1), sy(y1), `L=${L.toFixed(2)}`, {
    offset: I >= 0 ? 22 : -22,
  })

  // —— 辅助：导线中点十字准线 + F⊥L 直角标记 ——
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(sx(cx - 0.35), sy(cy))
  ctx.lineTo(sx(cx + 0.35), sy(cy))
  ctx.moveTo(sx(cx), sy(cy - 0.35))
  ctx.lineTo(sx(cx), sy(cy + 0.35))
  ctx.stroke()
  ctx.setLineDash([])

  // 安培力箭头（粉）
  if (Fmag > 0.08) {
    const flen = Math.min(2.2, 0.45 + 0.28 * Fmag)
    const ux = Fx / Fmag
    const uy = Fy / Fmag
    // 受力方向虚线延长，便于对照右手定则
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)'
    ctx.lineWidth = 1.4
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(sx(cx - ux * 0.4), sy(cy - uy * 0.4))
    ctx.lineTo(sx(cx + ux * (flen + 0.5)), sy(cy + uy * (flen + 0.5)))
    ctx.stroke()
    ctx.setLineDash([])

    drawArrow(
      ctx,
      sx(cx),
      sy(cy),
      sx(cx + ux * flen),
      sy(cy + uy * flen),
      'rgba(244, 114, 182, 0.95)',
      3,
    )
    drawDiagramLabel(ctx, `F (${Fmag.toFixed(2)})`, sx(cx + ux * flen) + 6, sy(cy + uy * flen) - 8, {
      color: 'rgba(244, 114, 182, 0.95)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })

    // F ⊥ L 小直角
    const px = -uy * 0.28
    const py = ux * 0.28
    const qx = lx * 0.28 * idir
    const qy = ly * 0.28 * idir
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)'
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.moveTo(sx(cx + qx), sy(cy + qy))
    ctx.lineTo(sx(cx + qx + px), sy(cy + qy + py))
    ctx.lineTo(sx(cx + px), sy(cy + py))
    ctx.stroke()
    drawDiagramLabel(ctx, 'F⊥L', sx(cx + px * 1.6 + qx * 0.5), sy(cy + py * 1.6 + qy * 0.5), {
      color: 'rgba(226, 232, 240, 0.85)',
      font: '10px "Segoe UI", sans-serif',
    })
  }

  // 方位角弧
  if (Math.abs(alpha) > 2) {
    const r = Math.min(0.9, L * 0.28)
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(sx(cx), sy(cy), Math.abs(sx(cx + r) - sx(cx)), 0, (-alpha * Math.PI) / 180, alpha < 0)
    ctx.stroke()
    drawDiagramLabel(ctx, `α=${alpha.toFixed(0)}°`, sx(x1) - 4, sy(y1) + 16, {
      color: 'rgba(251, 191, 36, 0.9)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  // 顶栏
  const theory = Math.abs(I) * L * Math.abs(B)
  const fCheck = ampereForce(I, L, B, alpha)
  const match = Math.abs(fCheck.Fmag - Fmag) < 0.08 && Math.abs(theory - Fmag) < 0.08
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(640, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxW, 52)
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, 52)
  drawDiagramLabel(
    ctx,
    match ? 'F=I L×B  ↔ 画面一致' : 'F=I L×B',
    boxX + 10,
    boxY + 18,
    {
      color: match ? 'rgba(74, 222, 128, 0.95)' : 'rgba(251, 191, 36, 0.95)',
      font: 'bold 13px "Segoe UI", sans-serif',
    },
  )
  drawDiagramLabel(
    ctx,
    `|F|=|I|L|B|=${theory.toFixed(3)}  读数=${Fmag.toFixed(3)}  F=(${Fx.toFixed(2)}, ${Fy.toFixed(2)})  B=${B.toFixed(2)}  α=${alpha.toFixed(0)}°`,
    boxX + 10,
    boxY + 38,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )

  drawDiagramLabel(
    ctx,
    Bout
      ? '播放扫 I · 绿=电流 · 粉=F · 虚线辅助 F⊥L · 右手：I→B(出)→F'
      : '播放扫 I · 绿=电流 · 粉=F · 虚线辅助 F⊥L · 右手：I→B(入)→F',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
