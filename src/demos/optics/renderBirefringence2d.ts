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
import { birefringenceState } from './birefringence'

export function birefringenceWorldBounds(world: number): WorldBounds {
  return {
    xMin: -1.2,
    xMax: world + 0.4,
    yMin: -world * 0.55,
    yMax: world * 0.55,
  }
}

function rayPoint(
  ox: number,
  oy: number,
  angleFromNormalDeg: number,
  len: number,
  intoCrystal: boolean,
): { x: number; y: number } {
  const a = (angleFromNormalDeg * Math.PI) / 180
  // 法线沿 +x；入射来自左侧，折射向右；y 向上为正，入射角使 y 增大
  const dx = Math.cos(a) * len
  const dy = Math.sin(a) * len
  return intoCrystal
    ? { x: ox + dx, y: oy + dy }
    : { x: ox - dx, y: oy + dy }
}

export function drawBirefringenceFrame(
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

  const nO = Number(snap.values.nO ?? 1.66)
  const nE = Number(snap.values.nE ?? 1.49)
  const L = Number(snap.values.L ?? 3.2)
  const gamma = Number(snap.values.gamma ?? 35)
  const thetaI = Number(snap.values.thetaI ?? 0)
  const thetaO = Number(snap.values.thetaO ?? 0)
  const thetaE = Number(snap.values.thetaE ?? 0)
  const yO = Number(snap.values.yO ?? 0)
  const yE = Number(snap.values.yE ?? 0)
  const deltaY = Number(snap.values.deltaY ?? 0)

  const x0 = 1.6
  const x1 = x0 + L
  const hitY = 0

  // 空气 / 晶体 / 空气
  ctx.fillStyle = 'rgba(74, 222, 128, 0.05)'
  ctx.fillRect(sx(world.xMin), sy(world.yMax), sx(x0) - sx(world.xMin), sy(world.yMin) - sy(world.yMax))
  ctx.fillStyle = 'rgba(148, 163, 184, 0.18)'
  ctx.fillRect(sx(x0), sy(world.yMax), sx(x1) - sx(x0), sy(world.yMin) - sy(world.yMax))
  ctx.fillStyle = 'rgba(56, 189, 248, 0.05)'
  ctx.fillRect(sx(x1), sy(world.yMax), sx(world.xMax) - sx(x1), sy(world.yMin) - sy(world.yMax))

  // 晶体边界
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.95)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(sx(x0), sy(world.yMax))
  ctx.lineTo(sx(x0), sy(world.yMin))
  ctx.moveTo(sx(x1), sy(world.yMax))
  ctx.lineTo(sx(x1), sy(world.yMin))
  ctx.stroke()
  drawDiagramLabel(ctx, '晶体板', sx((x0 + x1) / 2) - 20, sy(world.yMax) + 22, {
    color: 'rgba(203, 213, 225, 0.95)',
  })
  drawDiagramLabel(ctx, `nₒ=${nO.toFixed(2)}  nₑ=${nE.toFixed(2)}`, sx(x0) + 8, sy(world.yMin) - 10, {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDimLine(ctx, sx(x0), sy(-2.4), sx(x1), sy(-2.4), `L=${L.toFixed(1)}`, { offset: 0 })

  // 光轴（虚线）
  const g = (gamma * Math.PI) / 180
  const axLen = L * 0.55
  const acx = (x0 + x1) / 2
  const acy = -1.1
  const ax0 = { x: acx - Math.cos(g) * axLen, y: acy - Math.sin(g) * axLen }
  const ax1 = { x: acx + Math.cos(g) * axLen, y: acy + Math.sin(g) * axLen }
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.9)'
  ctx.lineWidth = 1.8
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(sx(ax0.x), sy(ax0.y))
  ctx.lineTo(sx(ax1.x), sy(ax1.y))
  ctx.stroke()
  ctx.setLineDash([])
  drawDiagramLabel(ctx, `光轴 γ=${gamma.toFixed(0)}°`, sx(ax1.x) - 10, sy(ax1.y) - 8, {
    color: 'rgba(196, 181, 253, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // 法线（入射点）
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
  ctx.lineWidth = 1.2
  ctx.setLineDash([4, 3])
  ctx.beginPath()
  ctx.moveTo(sx(x0 - 1.2), sy(hitY))
  ctx.lineTo(sx(x0 + 1.2), sy(hitY))
  ctx.stroke()
  ctx.setLineDash([])

  // 入射光线
  const inc = rayPoint(x0, hitY, thetaI, 2.2, false)
  drawArrow(ctx, sx(inc.x), sy(inc.y), sx(x0), sy(hitY), 'rgba(74, 222, 128, 0.95)', 2.4)
  drawDiagramLabel(ctx, `入射 θᵢ=${thetaI.toFixed(1)}°`, sx(inc.x) - 8, sy(inc.y) - 10, {
    color: 'rgba(74, 222, 128, 0.95)',
  })

  // 晶体内 o / e
  const oEnd = { x: x1, y: hitY + yO }
  const eEnd = { x: x1, y: hitY + yE }
  drawArrow(ctx, sx(x0), sy(hitY), sx(oEnd.x), sy(oEnd.y), 'rgba(56, 189, 248, 0.95)', 2.3)
  drawArrow(ctx, sx(x0), sy(hitY), sx(eEnd.x), sy(eEnd.y), 'rgba(251, 191, 36, 0.95)', 2.3)
  drawDiagramLabel(ctx, `o  θₒ=${thetaO.toFixed(1)}°`, sx((x0 + x1) / 2) - 10, sy((hitY + oEnd.y) / 2) - 12, {
    color: 'rgba(125, 211, 252, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, `e  θₑ=${thetaE.toFixed(1)}°`, sx((x0 + x1) / 2) - 10, sy((hitY + eEnd.y) / 2) + 16, {
    color: 'rgba(252, 211, 77, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // 出射（平行于入射方向，平移）
  const outLen = 1.8
  const oOut = rayPoint(oEnd.x, oEnd.y, thetaI, outLen, true)
  const eOut = rayPoint(eEnd.x, eEnd.y, thetaI, outLen, true)
  drawArrow(ctx, sx(oEnd.x), sy(oEnd.y), sx(oOut.x), sy(oOut.y), 'rgba(56, 189, 248, 0.85)', 2)
  drawArrow(ctx, sx(eEnd.x), sy(eEnd.y), sx(eOut.x), sy(eOut.y), 'rgba(251, 191, 36, 0.85)', 2)

  // 出射点与分离标注
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(sx(oEnd.x), sy(oEnd.y), 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(sx(eEnd.x), sy(eEnd.y), 5, 0, Math.PI * 2)
  ctx.fill()

  if (Math.abs(deltaY) > 0.05) {
    drawDimLine(ctx, sx(x1 + 0.15), sy(oEnd.y), sx(x1 + 0.15), sy(eEnd.y), `Δy=${deltaY.toFixed(2)}`, {
      offset: 14,
    })
  }

  // 偏振示意：o 垂直图面（圆点），e 在图面（短双箭头）
  const midO = { x: (x0 + x1) / 2, y: (hitY + oEnd.y) / 2 }
  const midE = { x: (x0 + x1) / 2 + 0.15, y: (hitY + eEnd.y) / 2 }
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(sx(midO.x), sy(midO.y), 6, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(56, 189, 248, 0.95)'
  ctx.beginPath()
  ctx.arc(sx(midO.x), sy(midO.y), 2.5, 0, Math.PI * 2)
  ctx.fill()
  drawDiagramLabel(ctx, '⊥', sx(midO.x) + 8, sy(midO.y) + 4, {
    color: 'rgba(125, 211, 252, 0.9)',
    font: '10px "Segoe UI", sans-serif',
  })
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx(midE.x) - 8, sy(midE.y))
  ctx.lineTo(sx(midE.x) + 8, sy(midE.y))
  ctx.stroke()
  drawDiagramLabel(ctx, '∥', sx(midE.x) + 10, sy(midE.y) + 4, {
    color: 'rgba(252, 211, 77, 0.9)',
    font: '10px "Segoe UI", sans-serif',
  })

  // 顶栏公式
  const s = birefringenceState(thetaI, nO, nE, L, gamma)
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(620, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxW, 52)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, 52)
  drawDiagramLabel(ctx, s.label, boxX + 10, boxY + 18, {
    color:
      s.uniaxial === 'iso'
        ? 'rgba(148, 163, 184, 0.95)'
        : 'rgba(196, 181, 253, 0.95)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `sinθᵢ=${Math.sin((thetaI * Math.PI) / 180).toFixed(3)}  →  θₒ=${thetaO.toFixed(2)}°  θₑ=${thetaE.toFixed(2)}°   Δy=L(tanθₑ−tanθₒ)=${deltaY.toFixed(3)}`,
    boxX + 10,
    boxY + 38,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )

  drawDiagramLabel(
    ctx,
    '播放：增大 θᵢ · 青色 o / 金色 e 分叉 · 右侧双像分离 Δy',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
