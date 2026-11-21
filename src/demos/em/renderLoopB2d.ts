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
import { loopBAt, loopBAxis } from './loopB'

export function loopBWorldBounds(world: number): WorldBounds {
  return {
    xMin: -world,
    xMax: world,
    yMin: -world * 0.72,
    yMax: world * 0.72,
  }
}

function drawWireMark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outOfPage: boolean,
): void {
  ctx.save()
  ctx.fillStyle = '#f87171'
  ctx.beginPath()
  ctx.arc(cx, cy, 11, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(254, 202, 202, 0.95)'
  ctx.lineWidth = 2
  ctx.stroke()
  if (outOfPage) {
    ctx.fillStyle = '#0b1220'
    ctx.beginPath()
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.strokeStyle = '#0b1220'
    ctx.lineWidth = 2.3
    ctx.lineCap = 'round'
    const s = 4.5
    ctx.beginPath()
    ctx.moveTo(cx - s, cy - s)
    ctx.lineTo(cx + s, cy + s)
    ctx.moveTo(cx + s, cy - s)
    ctx.lineTo(cx - s, cy + s)
    ctx.stroke()
  }
  ctx.restore()
}

/** 在过轴平面画磁力线（RK 积分） */
function traceFieldLines(
  I: number,
  a: number,
  world: WorldBounds,
): number[][][] {
  const paths: number[][][] = []
  const seeds: [number, number][] = []
  // 环内侧/外侧种子
  for (const y0 of [-a * 0.55, a * 0.55, -a * 1.35, a * 1.35, -a * 0.2, a * 0.2]) {
    seeds.push([-a * 0.15, y0])
    seeds.push([a * 0.15, y0])
  }
  seeds.push([-a * 1.8, 0.35], [a * 1.8, 0.35], [-a * 1.8, -0.35], [a * 1.8, -0.35])

  const step = 0.08
  const maxSteps = 90
  for (const [sx0, sy0] of seeds) {
    for (const dir of [1, -1]) {
      const path: number[][] = [[sx0, sy0]]
      let x = sx0
      let y = sy0
      for (let s = 0; s < maxSteps; s++) {
        const [Bx, By] = loopBAt(I, a, x, y, 48)
        const Bm = Math.hypot(Bx, By)
        if (Bm < 1e-4) break
        x += (dir * step * Bx) / Bm
        y += (dir * step * By) / Bm
        if (x < world.xMin + 0.1 || x > world.xMax - 0.1) break
        if (y < world.yMin + 0.1 || y > world.yMax - 0.1) break
        // 撞上导线截面
        if (Math.hypot(x, y - a) < 0.22 || Math.hypot(x, y + a) < 0.22) break
        path.push([x, y])
      }
      if (path.length > 8) paths.push(path)
    }
  }
  return paths
}

export function drawLoopBFrame(
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

  const I = Number(snap.values.I ?? 2)
  const a = Number(snap.values.a ?? 1.4)
  const sense = I >= 0 ? 1 : -1

  // 磁力线
  const lines = traceFieldLines(I, a, world)
  for (const path of lines) {
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.72)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < path.length; i++) {
      const p = path[i]!
      if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
      else ctx.lineTo(sx(p[0]!), sy(p[1]!))
    }
    ctx.stroke()
    // 箭头
    if (path.length > 12) {
      const i = Math.floor(path.length * 0.45)
      const p0 = path[i - 1]!
      const p1 = path[i]!
      drawArrow(
        ctx,
        sx(p0[0]!),
        sy(p0[1]!),
        sx(p1[0]!),
        sy(p1[1]!),
        'rgba(52, 211, 153, 0.9)',
        1.6,
      )
    }
  }

  // 轴线
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.lineWidth = 1.4
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin) + 4, sy(0))
  ctx.lineTo(sx(world.xMax) - 4, sy(0))
  ctx.stroke()
  ctx.setLineDash([])
  drawDiagramLabel(ctx, '轴线', sx(world.xMax) - 48, sy(0) - 12, {
    color: 'rgba(196, 181, 253, 0.9)',
  })

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(167, 139, 250, 0.35)',
      label: opts.compare.label,
    })
  }

  // 圆环截面（与 Biot 参数一致）：I>0 时上 ·（出纸）下 ×（入纸）→ 轴上场向 +x
  const topOutOfPage = sense > 0
  drawWireMark(ctx, sx(0), sy(a), topOutOfPage)
  drawWireMark(ctx, sx(0), sy(-a), !topOutOfPage)

  drawDimLine(ctx, sx(0), sy(-a), sx(0), sy(a), `2a=${(2 * a).toFixed(1)}`, { offset: -22 })
  drawDiagramLabel(ctx, '圆环截面', sx(0) + 16, sy(a) - 8, {
    color: 'rgba(248, 113, 113, 0.95)',
  })

  // 轴上场示意箭头（多处）
  for (const xi of [-a * 1.6, -a * 0.7, 0, a * 0.7, a * 1.6]) {
    const B = loopBAxis(I, a, xi)
    if (Math.abs(B) < 0.05) continue
    const len = Math.min(0.85, 0.25 + 0.35 * Math.abs(B))
    const dir = B >= 0 ? 1 : -1
    drawArrow(
      ctx,
      sx(xi - dir * len * 0.5),
      sy(0),
      sx(xi + dir * len * 0.5),
      sy(0),
      'rgba(96, 165, 250, 0.75)',
      2,
    )
  }

  // 探测点
  const x = Number(snap.values.x ?? 0)
  const Baxis = Number(snap.values.Baxis ?? 0)
  const B0 = Number(snap.values.B0 ?? 0)
  const Bx = Number(snap.values.Bx ?? 0)
  const ppx = sx(x)
  const ppy = sy(0)
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(ppx, ppy, 7, 0, Math.PI * 2)
  ctx.fill()
  if (Math.abs(Baxis) > 1e-6) {
    const alen = Math.min(1.2, 0.4 + 0.35 * Math.abs(Baxis))
    const dir = Baxis >= 0 ? 1 : -1
    drawArrow(ctx, ppx, ppy, sx(x + dir * alen), ppy, 'rgba(251, 191, 36, 0.95)', 2.6)
  }

  // 公式顶栏
  const theory = loopBAxis(I, a, x)
  const match = Math.abs(theory - Baxis) < 0.06 && Math.abs(theory - Bx) < 0.12
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(660, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxW, 52)
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, 52)
  drawDiagramLabel(
    ctx,
    match ? '轴上公式 ↔ 探测点一致' : '轴上公式 ↔ 探测点',
    boxX + 10,
    boxY + 18,
    {
      color: match ? 'rgba(74, 222, 128, 0.95)' : 'rgba(251, 191, 36, 0.95)',
      font: 'bold 13px "Segoe UI", sans-serif',
    },
  )
  drawDiagramLabel(
    ctx,
    `B∥=I a²/(a²+x²)^{3/2}=${theory.toFixed(3)}  读数=${Baxis.toFixed(3)}  B(0)=I/a=${B0.toFixed(3)}  x=${x.toFixed(2)}  a=${a.toFixed(2)}`,
    boxX + 10,
    boxY + 38,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )

  drawDiagramLabel(
    ctx,
    '侧视：上下为圆环截面 · 青绿=磁力线 · 蓝箭头=轴上场 · 播放沿轴扫过',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
