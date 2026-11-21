import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import { thinLens } from './lens'

export function lensWorldBounds(u: number, v: number, f: number): WorldBounds {
  const right = Math.max(2.5 * f, v > 0 ? v + 1.2 : 2.5 * f)
  const left = Math.max(u + 1.2, 2.5 * f)
  return {
    xMin: -left,
    xMax: right,
    yMin: -2.8,
    yMax: 2.8,
  }
}

function drawLensSymbol(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  halfH: number,
): void {
  // 双凸透镜示意
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.95)'
  ctx.fillStyle = 'rgba(167, 139, 250, 0.18)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(ox, oy - halfH)
  ctx.quadraticCurveTo(ox + 14, oy, ox, oy + halfH)
  ctx.quadraticCurveTo(ox - 14, oy, ox, oy - halfH)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  // 箭头形边缘
  ctx.fillStyle = 'rgba(167, 139, 250, 0.95)'
  for (const [y, dir] of [
    [oy - halfH, -1],
    [oy + halfH, 1],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(ox, y)
    ctx.lineTo(ox - 7, y - dir * 10)
    ctx.lineTo(ox + 7, y - dir * 10)
    ctx.closePath()
    ctx.fill()
  }
}

function drawFocus(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  x: number,
  label: string,
): void {
  const px = sx(x)
  const py = sy(0)
  ctx.fillStyle = 'rgba(251, 191, 36, 0.95)'
  ctx.beginPath()
  ctx.arc(px, py, 4, 0, Math.PI * 2)
  ctx.fill()
  drawDiagramLabel(ctx, label, px - 6, py + 16, {
    color: 'rgba(251, 191, 36, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })
}

export function drawLensFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  _worldHint?: WorldBounds,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const f = Number(snap.values.f ?? 2)
  const u = Number(snap.values.u ?? 4)
  const finite = Number(snap.values.finite ?? 1) > 0.5
  const real = Number(snap.values.real ?? 1) > 0.5
  const hObj = Number(snap.values.hObj ?? 1.2)
  const hImg = Number(snap.values.hImg ?? 0)
  const m = Number(snap.values.m ?? 0)
  const caseCode = Number(snap.values.caseCode ?? 0)

  const s = thinLens(u, f)
  const v = finite ? s.v : 0
  const world = lensWorldBounds(u, finite && real ? v : Math.abs(v), f)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const ox = sx(0)
  const oy = sy(0)
  const halfLens = Math.abs(sy(2.2) - sy(0))

  // 主光轴已由网格轴画出；加粗光轴段
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin) + 4, oy)
  ctx.lineTo(sx(world.xMax) - 4, oy)
  ctx.stroke()

  drawLensSymbol(ctx, ox, oy, halfLens)
  drawDiagramLabel(ctx, '透镜', ox - 14, oy - halfLens - 8, {
    color: 'rgba(167, 139, 250, 0.95)',
  })

  // 焦点 F（物方，左）F′（像方，右）
  drawFocus(ctx, sx, sy, -f, 'F')
  drawFocus(ctx, sx, sy, f, "F'")
  // 2f 参考虚线
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(sx(-2 * f), sy(2.4))
  ctx.lineTo(sx(-2 * f), sy(-2.4))
  ctx.moveTo(sx(2 * f), sy(2.4))
  ctx.lineTo(sx(2 * f), sy(-2.4))
  ctx.stroke()
  ctx.setLineDash([])
  drawDiagramLabel(ctx, '2f', sx(-2 * f) - 8, sy(2.5), {
    color: 'rgba(148, 163, 184, 0.7)',
    font: '10px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, "2f'", sx(2 * f) - 8, sy(2.5), {
    color: 'rgba(148, 163, 184, 0.7)',
    font: '10px "Segoe UI", sans-serif',
  })

  // —— 物 ——
  const objX = -u
  const objTop = hObj
  drawArrow(ctx, sx(objX), oy, sx(objX), sy(objTop), 'rgba(74, 222, 128, 0.98)', 2.8)
  drawDiagramLabel(ctx, '物', sx(objX) - 18, sy(objTop) - 8, {
    color: 'rgba(74, 222, 128, 0.95)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })

  // 三条特征光线（从物顶发出）
  const yTop = objTop
  const xL = 0 // lens plane

  // ① 平行主轴 → 过 F'
  const x1a = objX
  const y1a = yTop
  const x1b = xL
  const y1b = yTop
  drawArrow(ctx, sx(x1a), sy(y1a), sx(x1b), sy(y1b), 'rgba(74, 222, 128, 0.85)', 1.8)

  // ② 过光心
  // ③ 过 F 再平行 —— 一并在会聚侧绘制

  if (finite && real) {
    // 出射：① 过 F' 到像顶
    const imgX = v
    const imgTop = hImg
    drawArrow(ctx, sx(x1b), sy(y1b), sx(imgX), sy(imgTop), 'rgba(56, 189, 248, 0.9)', 1.8)

    // ② 过光心：物顶 → 光心 → 像顶
    drawArrow(ctx, sx(objX), sy(yTop), ox, oy, 'rgba(74, 222, 128, 0.75)', 1.6)
    drawArrow(ctx, ox, oy, sx(imgX), sy(imgTop), 'rgba(56, 189, 248, 0.75)', 1.6)

    // ③ 过 F：物顶 → F → 透镜高度 → 平行出射到像
    // 物顶到 F 的延长与透镜相交的高度
    // 线：从 (objX,yTop) 过 (-f,0)
    const tLens = (0 - objX) / (-f - objX)
    const y3 = yTop + tLens * (0 - yTop)
    drawArrow(ctx, sx(objX), sy(yTop), sx(0), sy(y3), 'rgba(74, 222, 128, 0.65)', 1.5)
    drawArrow(ctx, sx(0), sy(y3), sx(imgX), sy(imgTop), 'rgba(56, 189, 248, 0.65)', 1.5)

    // 像
    drawArrow(ctx, sx(imgX), oy, sx(imgX), sy(imgTop), 'rgba(56, 189, 248, 0.98)', 2.8)
    drawDiagramLabel(ctx, '实像', sx(imgX) + 6, sy(imgTop) - 4, {
      color: 'rgba(56, 189, 248, 0.95)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  } else if (finite && !real) {
    // 虚像：出射光线发散，反向延长会聚于左侧虚像
    const imgX = v // negative
    const imgTop = hImg // positive for erect

    // ① 平行入射后过 F' 方向发散（向右下/上）
    // 出射方向沿透镜高度 yTop 指向 F' 的反向延长... 实际：过透镜后朝 F' 方向
    // 简化：从透镜 (0,yTop) 沿离开 F' 的方向向右画实线，向左虚线到虚像
    const dirX = 1
    const dirY = (0 - yTop) / (f - 0) // toward F' from (0,yTop) would be to F', emergent continues that way... 
    // For converging lens: ray parallel hits lens at yTop, goes through F' (f,0)
    // So from (0,yTop) through (f,0) and beyond
    const tFar = 2.5
    const xFar = 0 + (f - 0) * tFar
    const yFar = yTop + (0 - yTop) * tFar
    drawArrow(ctx, sx(0), sy(yTop), sx(xFar), sy(yFar), 'rgba(56, 189, 248, 0.85)', 1.8)
    // 虚线反向到虚像顶
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'
    ctx.setLineDash([5, 4])
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(sx(0), sy(yTop))
    ctx.lineTo(sx(imgX), sy(imgTop))
    ctx.stroke()

    // ② 过光心：实线向右延长，虚线向左到虚像
    const t2 = 2.2
    const x2 = objX + (0 - objX) * t2
    const y2 = yTop + (0 - yTop) * t2
    drawArrow(ctx, sx(objX), sy(yTop), sx(x2), sy(y2), 'rgba(74, 222, 128, 0.8)', 1.6)
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(sx(imgX), sy(imgTop))
    ctx.stroke()
    ctx.setLineDash([])

    // 虚像箭头
    drawArrow(ctx, sx(imgX), oy, sx(imgX), sy(imgTop), 'rgba(56, 189, 248, 0.7)', 2.4)
    drawDiagramLabel(ctx, '虚像', sx(imgX) - 28, sy(imgTop) - 6, {
      color: 'rgba(56, 189, 248, 0.9)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
    void dirX
    void dirY
  } else {
    // 近焦点：出射近乎平行
    drawArrow(ctx, sx(0), sy(yTop), sx(world.xMax - 0.5), sy(yTop * 0.15), 'rgba(56, 189, 248, 0.85)', 1.8)
    drawArrow(ctx, sx(objX), sy(yTop), sx(world.xMax - 0.5), sy(yTop * 0.4), 'rgba(56, 189, 248, 0.65)', 1.5)
    drawDiagramLabel(ctx, '像 → ∞', sx(world.xMax) - 70, sy(0.8), {
      color: 'rgba(248, 113, 113, 0.9)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  }

  // 物距 / 像距标注
  drawDiagramLabel(ctx, `u=${u.toFixed(2)}`, sx(objX / 2) - 10, oy + 18, {
    color: 'rgba(74, 222, 128, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })
  if (finite && real) {
    drawDiagramLabel(ctx, `v=${v.toFixed(2)}`, sx(v / 2) - 10, oy + 18, {
      color: 'rgba(56, 189, 248, 0.9)',
      font: '11px "Segoe UI", sans-serif',
    })
  } else if (finite && !real) {
    drawDiagramLabel(ctx, `v=${v.toFixed(2)}（虚）`, sx(v / 2) - 20, oy + 18, {
      color: 'rgba(56, 189, 248, 0.9)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  // 顶栏
  const caseLabels: Record<number, string> = {
    1: 'u>2f · 实像倒立缩小',
    2: 'u=2f · 实像倒立等大',
    3: 'f<u<2f · 实像倒立放大',
    4: 'u≈f · 像在无穷远',
    5: 'u<f · 虚像正立放大',
  }
  const status = caseLabels[caseCode] ?? s.caseLabel
  const formulaLine = finite
    ? `1/u+1/v=1/f → v=${v.toFixed(2)}  m=−v/u=${m.toFixed(2)}  像高=${hImg.toFixed(2)}`
    : `u≈f → v→∞  （平行光出射）`
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(560, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxW, 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, 48)
  drawDiagramLabel(ctx, status, boxX + 10, boxY + 18, {
    color: 'rgba(196, 181, 253, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, formulaLine, boxX + 10, boxY + 36, {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })

  drawDiagramLabel(
    ctx,
    '播放：物由远及近 · 绿=入射 蓝=出射/像 · 虚线=反向延长',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
