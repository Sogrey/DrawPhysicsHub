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

export function motionalEmfWorldBounds(world: number): WorldBounds {
  return {
    xMin: -0.8,
    xMax: world,
    yMin: -world * 0.55,
    yMax: world * 0.55,
  }
}

function drawBMarks(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  sx: (x: number) => number,
  sy: (y: number) => number,
  out: boolean,
): void {
  const step = 0.55
  ctx.save()
  for (let x = x0 + 0.25; x < x1 - 0.1; x += step) {
    for (let y = y0 + 0.25; y < y1 - 0.1; y += step) {
      const px = sx(x)
      const py = sy(y)
      if (out) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
        ctx.lineWidth = 1.1
        ctx.beginPath()
        ctx.arc(px, py, 4.5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'
        ctx.beginPath()
        ctx.arc(px, py, 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
        ctx.lineWidth = 1.3
        const s = 3.5
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

export function drawMotionalEmfFrame(
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

  const B = Number(snap.values.B ?? 1.2)
  const L = Number(snap.values.L ?? 2)
  const v = Number(snap.values.v ?? 0.8)
  const R = Number(snap.values.R ?? 1)
  const x = Number(snap.values.x ?? 1)
  const emf = Number(snap.values.emf ?? 0)
  const Phi = Number(snap.values.Phi ?? 0)
  const I = Number(snap.values.I ?? 0)
  const Fx = Number(snap.values.Fx ?? 0)
  const Bout = Number(snap.values.Bout ?? 1) >= 0.5
  const half = L / 2
  const x0 = 0

  // 回路面积填充
  ctx.fillStyle = 'rgba(56, 189, 248, 0.12)'
  ctx.fillRect(sx(x0), sy(half), sx(x) - sx(x0), sy(-half) - sy(half))

  // 辅助：面积边框虚线（Φ 区域）
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)'
  ctx.lineWidth = 1.6
  ctx.setLineDash([6, 4])
  ctx.strokeRect(sx(x0), sy(half), sx(x) - sx(x0), sy(-half) - sy(half))
  ctx.setLineDash([])
  drawDiagramLabel(ctx, `Φ 区域  A=Lx`, sx((x0 + x) / 2) - 28, sy(0) + 6, {
    color: 'rgba(125, 211, 252, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })

  drawBMarks(ctx, x0, Math.max(x, x0 + 0.5), -half, half, sx, sy, Bout)

  // 导轨
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(half))
  ctx.lineTo(sx(world.xMax - 0.4), sy(half))
  ctx.moveTo(sx(x0), sy(-half))
  ctx.lineTo(sx(world.xMax - 0.4), sy(-half))
  ctx.stroke()
  // 左端连接
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(half))
  ctx.lineTo(sx(x0), sy(-half))
  ctx.stroke()

  // 辅助：导轨延伸虚线（未闭合部分）
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(sx(x), sy(half))
  ctx.lineTo(sx(world.xMax - 0.4), sy(half))
  ctx.moveTo(sx(x), sy(-half))
  ctx.lineTo(sx(world.xMax - 0.4), sy(-half))
  ctx.stroke()
  ctx.setLineDash([])

  drawDiagramLabel(ctx, Bout ? 'B · 出纸面' : 'B × 入纸面', sx(x0) + 8, sy(half) + 18, {
    color: 'rgba(148, 163, 184, 0.95)',
  })
  drawDimLine(ctx, sx(x0 - 0.25), sy(-half), sx(x0 - 0.25), sy(half), `L=${L.toFixed(1)}`, {
    offset: -8,
  })

  // 滑杆
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(sx(x), sy(half))
  ctx.lineTo(sx(x), sy(-half))
  ctx.stroke()
  drawDiagramLabel(ctx, '滑杆', sx(x) + 8, sy(half) - 6, {
    color: 'rgba(251, 191, 36, 0.95)',
  })

  // 辅助：切割示意（杆上短斜线 = 切割磁感线）
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
  ctx.lineWidth = 1.2
  for (let k = -2; k <= 2; k++) {
    const yy = (half * 0.7 * k) / 2
    ctx.beginPath()
    ctx.moveTo(sx(x - 0.18), sy(yy + 0.12))
    ctx.lineTo(sx(x + 0.18), sy(yy - 0.12))
    ctx.stroke()
  }

  // 速度箭头
  const vLen = Math.min(1.1, 0.5 + v)
  drawArrow(ctx, sx(x), sy(0), sx(x + vLen), sy(0), 'rgba(125, 211, 252, 0.95)', 2.4)
  drawDiagramLabel(ctx, `v=${v.toFixed(2)}`, sx(x + 0.7), sy(0) - 12, {
    color: 'rgba(125, 211, 252, 0.95)',
  })

  // 感应电流：完整回路辅助线 + 箭头
  if (Math.abs(I) > 0.05) {
    const a = 0.5 + 0.45 * Math.min(1, Math.abs(I))
    const col = `rgba(74, 222, 128, ${a})`
    // 回路路径虚线
    ctx.strokeStyle = `rgba(74, 222, 128, ${0.35 + 0.25 * Math.min(1, Math.abs(I))})`
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.strokeRect(sx(x0), sy(half), sx(x) - sx(x0), sy(-half) - sy(half))
    ctx.setLineDash([])
    // 滑杆：向下
    drawArrow(ctx, sx(x), sy(half * 0.55), sx(x), sy(-half * 0.55), col, 2.2)
    // 左端：向上
    drawArrow(ctx, sx(x0), sy(-half * 0.55), sx(x0), sy(half * 0.55), col, 2)
    if (x > 0.8) {
      drawArrow(ctx, sx(x * 0.7), sy(half), sx(x * 0.25), sy(half), col, 2)
      drawArrow(ctx, sx(x * 0.35), sy(-half), sx(x * 0.75), sy(-half), col, 2)
    }
    drawDiagramLabel(ctx, `I=${I.toFixed(2)} A（顺时针）`, sx(x) - 90, sy(0) + 18, {
      color: 'rgba(74, 222, 128, 0.95)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  // 安培力（阻碍，向左）+ v/F 对峙辅助
  if (Math.abs(Fx) > 0.05) {
    const flen = Math.min(1.4, 0.35 + 0.25 * Math.abs(Fx))
    const dir = Fx >= 0 ? 1 : -1
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)'
    ctx.lineWidth = 1.3
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(sx(x - dir * 0.3), sy(0.35))
    ctx.lineTo(sx(x + dir * (flen + 0.35)), sy(0.35))
    ctx.stroke()
    ctx.setLineDash([])
    drawArrow(ctx, sx(x), sy(0.35), sx(x + dir * flen), sy(0.35), 'rgba(244, 114, 182, 0.95)', 2.6)
    drawDiagramLabel(ctx, `F (阻尼)`, sx(x + dir * flen * 0.5) - 20, sy(0.35) - 12, {
      color: 'rgba(244, 114, 182, 0.95)',
      font: '11px "Segoe UI", sans-serif',
    })
    // v 与 F 反向标注
    drawDiagramLabel(ctx, 'v →  ← F（楞次）', sx(x) - 36, sy(-0.55), {
      color: 'rgba(226, 232, 240, 0.85)',
      font: '10px "Segoe UI", sans-serif',
    })
  }

  drawDimLine(ctx, sx(x0), sy(-half - 0.35), sx(x), sy(-half - 0.35), `x=${x.toFixed(2)}`, {
    offset: 0,
  })

  // 顶栏
  const theory = B * L * v
  const match = Math.abs(theory - emf) < 0.05
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(660, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxW, 52)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, 52)
  drawDiagramLabel(ctx, match ? 'ε=BLv ↔ 画面一致 · 楞次阻碍扩张' : 'ε=BLv', boxX + 10, boxY + 18, {
    color: match ? 'rgba(74, 222, 128, 0.95)' : 'rgba(251, 191, 36, 0.95)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `ε=BLv=${theory.toFixed(3)}  Φ=BLx=${Phi.toFixed(3)}  I=ε/R=${I.toFixed(3)}  Fₓ=${Fx.toFixed(3)}  R=${R.toFixed(1)}`,
    boxX + 10,
    boxY + 38,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )

  drawDiagramLabel(
    ctx,
    '播放：滑杆外移 · 面积↑ · ε=BLv 恒定 · 粉箭头=电磁阻尼',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
