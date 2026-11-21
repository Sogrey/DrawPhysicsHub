import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function refractionWorldBounds(world: number): WorldBounds {
  const half = world * 0.55
  return {
    xMin: -half,
    xMax: half,
    yMin: -half * 0.85,
    yMax: half * 0.85,
  }
}

function rayEnd(
  ox: number,
  oy: number,
  angleFromNormalDeg: number,
  side: 'up-left' | 'up-right' | 'down-left' | 'down-right',
  len: number,
): { x: number; y: number } {
  // angle from +y normal (screen: up is −sy direction in world +y)
  const a = (angleFromNormalDeg * Math.PI) / 180
  const sx = Math.sin(a) * len
  const sy = Math.cos(a) * len
  switch (side) {
    case 'up-left':
      return { x: ox - sx, y: oy + sy }
    case 'up-right':
      return { x: ox + sx, y: oy + sy }
    case 'down-left':
      return { x: ox - sx, y: oy - sy }
    case 'down-right':
      return { x: ox + sx, y: oy - sy }
  }
}

export function drawRefractionFrame(
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

  const n1 = Number(snap.values.n1 ?? 1)
  const n2 = Number(snap.values.n2 ?? 1.5)
  const theta1 = Number(snap.values.theta1 ?? 0)
  const thetaR = Number(snap.values.thetaR ?? 0)
  const theta2 = Number(snap.values.theta2 ?? 0)
  const critical = Number(snap.values.critical ?? 90)
  const tir = Number(snap.values.tir ?? 0) > 0.5

  const ox = sx(0)
  const oy = sy(0)

  // media fills
  ctx.fillStyle = 'rgba(74, 222, 128, 0.06)'
  ctx.fillRect(sx(world.xMin), sy(world.yMax), sx(world.xMax) - sx(world.xMin), oy - sy(world.yMax))
  ctx.fillStyle = 'rgba(56, 189, 248, 0.08)'
  ctx.fillRect(sx(world.xMin), oy, sx(world.xMax) - sx(world.xMin), sy(world.yMin) - oy)

  // interface
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin) + 4, oy)
  ctx.lineTo(sx(world.xMax) - 4, oy)
  ctx.stroke()
  drawDiagramLabel(ctx, '界面', sx(world.xMax) - 48, oy - 14, {
    color: 'rgba(226, 232, 240, 0.9)',
  })

  // normal
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(ox, sy(world.yMax) + 8)
  ctx.lineTo(ox, sy(world.yMin) - 8)
  ctx.stroke()
  ctx.setLineDash([])
  drawDiagramLabel(ctx, '法线', ox + 8, sy(world.yMax) + 28, {
    color: 'rgba(148, 163, 184, 0.95)',
  })

  drawDiagramLabel(ctx, `n₁=${n1.toFixed(2)}`, sx(world.xMin) + 12, sy(world.yMax) + 28, {
    color: 'rgba(74, 222, 128, 0.95)',
  })
  drawDiagramLabel(ctx, `n₂=${n2.toFixed(2)}`, sx(world.xMin) + 12, sy(world.yMin) - 12, {
    color: 'rgba(56, 189, 248, 0.95)',
  })

  // incident (from up-left toward origin)
  const inc = rayEnd(0, 0, theta1, 'up-left', 2.2)
  const incS = { x: sx(inc.x), y: sy(inc.y) }
  drawArrow(ctx, incS.x, incS.y, ox, oy, 'rgba(74, 222, 128, 0.95)', 2.6)
  drawDiagramLabel(ctx, '入射', (incS.x + ox) / 2 - 24, (incS.y + oy) / 2 - 10, {
    color: 'rgba(74, 222, 128, 0.95)',
  })
  if (theta1 > 4) {
    // 入射在法线左侧
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)'
    ctx.lineWidth = 1.6
    const a0 = -Math.PI / 2
    const a1 = -Math.PI / 2 - (theta1 * Math.PI) / 180
    ctx.beginPath()
    ctx.arc(ox, oy, 36, Math.min(a0, a1), Math.max(a0, a1))
    ctx.stroke()
    ctx.fillStyle = 'rgba(74, 222, 128, 0.9)'
    ctx.font = '11px "Segoe UI", sans-serif'
    const mid = (a0 + a1) / 2
    ctx.fillText(
      `θ₁=${theta1.toFixed(0)}°`,
      ox + Math.cos(mid) * 48 - 10,
      oy + Math.sin(mid) * 48 + 4,
    )
  }

  // reflected (up-right)
  const ref = rayEnd(0, 0, thetaR, 'up-right', 2.2)
  const refS = { x: sx(ref.x), y: sy(ref.y) }
  drawArrow(ctx, ox, oy, refS.x, refS.y, 'rgba(251, 191, 36, 0.95)', 2.4)
  drawDiagramLabel(ctx, '反射', (ox + refS.x) / 2 + 6, (oy + refS.y) / 2 - 10, {
    color: 'rgba(251, 191, 36, 0.95)',
  })
  if (thetaR > 4) {
    // 反射在法线右侧：从法线（上）顺时针扫到反射线
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.lineWidth = 1.6
    const a0 = -Math.PI / 2
    const a1 = -Math.PI / 2 + (thetaR * Math.PI) / 180
    ctx.beginPath()
    ctx.arc(ox, oy, 28, a0, a1)
    ctx.stroke()
    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.font = '11px "Segoe UI", sans-serif'
    const mid = (a0 + a1) / 2
    ctx.fillText(
      `θᵣ=${thetaR.toFixed(0)}°`,
      ox + Math.cos(mid) * 40 - 6,
      oy + Math.sin(mid) * 40 + 4,
    )
  }

  // refracted or TIR
  if (!tir && Number.isFinite(theta2)) {
    const tr = rayEnd(0, 0, theta2, 'down-right', 2.2)
    const trS = { x: sx(tr.x), y: sy(tr.y) }
    drawArrow(ctx, ox, oy, trS.x, trS.y, 'rgba(56, 189, 248, 0.98)', 2.6)
    drawDiagramLabel(ctx, '折射', (ox + trS.x) / 2 + 6, (oy + trS.y) / 2 + 14, {
      color: 'rgba(56, 189, 248, 0.95)',
    })
    if (theta2 > 4) {
      // 折射在法线下方右侧
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
      ctx.lineWidth = 1.6
      const a0 = Math.PI / 2
      const a1 = Math.PI / 2 - (theta2 * Math.PI) / 180
      ctx.beginPath()
      ctx.arc(ox, oy, 34, Math.min(a0, a1), Math.max(a0, a1))
      ctx.stroke()
      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)'
      ctx.font = '11px "Segoe UI", sans-serif'
      const mid = (a0 + a1) / 2
      ctx.fillText(
        `θ₂=${theta2.toFixed(0)}°`,
        ox + Math.cos(mid) * 46 - 6,
        oy + Math.sin(mid) * 46 + 4,
      )
    }
  } else {
    // 全反射提示
    ctx.fillStyle = 'rgba(244, 114, 182, 0.18)'
    ctx.beginPath()
    ctx.arc(ox, oy, 22, 0, Math.PI * 2)
    ctx.fill()
    drawDiagramLabel(ctx, '全反射 TIR', ox + 18, oy + 28, {
      color: 'rgba(244, 114, 182, 0.98)',
      font: 'bold 13px "Segoe UI", sans-serif',
    })
    // faint dashed continuation into medium 2 (evanescent hint)
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)'
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1.5
    const ghost = rayEnd(0, 0, 88, 'down-right', 1.2)
    ctx.beginPath()
    ctx.moveTo(ox, oy)
    ctx.lineTo(sx(ghost.x), sy(ghost.y))
    ctx.stroke()
    ctx.setLineDash([])
  }

  // critical marker when n1>n2
  if (n1 > n2 + 0.01 && critical < 89) {
    const c = rayEnd(0, 0, critical, 'up-left', 1.6)
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.55)'
    ctx.setLineDash([3, 3])
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(sx(c.x), sy(c.y))
    ctx.lineTo(ox, oy)
    ctx.stroke()
    ctx.setLineDash([])
    drawDiagramLabel(ctx, `θc=${critical.toFixed(0)}°`, sx(c.x) - 10, sy(c.y) - 8, {
      color: 'rgba(244, 114, 182, 0.9)',
      font: '11px "Segoe UI", sans-serif',
    })
  }

  // pulse along incident→exit for formation feel
  const t = Number(snap.time ?? 0)
  const T = Number(snap.values.period ?? 8)
  const phase = (t / Math.max(T, 1e-9)) % 1
  // show a moving bead on the active path: incident then reflected/refracted
  const beadOnIncident = phase < 0.45
  const u = beadOnIncident ? phase / 0.45 : (phase - 0.45) / 0.55
  let bx: number
  let by: number
  if (beadOnIncident) {
    bx = incS.x + (ox - incS.x) * u
    by = incS.y + (oy - incS.y) * u
  } else if (tir) {
    bx = ox + (refS.x - ox) * u
    by = oy + (refS.y - oy) * u
  } else {
    const tr = rayEnd(0, 0, theta2, 'down-right', 2.2)
    bx = ox + (sx(tr.x) - ox) * u
    by = oy + (sy(tr.y) - oy) * u
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.beginPath()
  ctx.arc(bx, by, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(56, 189, 248, 0.9)'
  ctx.beginPath()
  ctx.arc(bx, by, 3, 0, Math.PI * 2)
  ctx.fill()

  // status (screen space)
  const status = tir
    ? `全反射 · θ₁=${theta1.toFixed(1)}° ≥ θc=${critical.toFixed(1)}°`
    : `斯涅尔 · n₁sinθ₁=${(n1 * Math.sin((theta1 * Math.PI) / 180)).toFixed(3)} = n₂sinθ₂=${(n2 * Math.sin((theta2 * Math.PI) / 180)).toFixed(3)}`
  const boxX = 12
  const boxY = 10
  const boxW = Math.min(520, W - 24)
  const boxH = 44
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
  ctx.fillRect(boxX, boxY, boxW, boxH)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, boxH)
  drawDiagramLabel(ctx, status, boxX + 10, boxY + 16, {
    color: 'rgba(125, 211, 252, 0.98)',
    font: 'bold 12px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `θ₁=${theta1.toFixed(1)}°  θᵣ=${thetaR.toFixed(1)}°  θ₂=${tir ? '—' : theta2.toFixed(1) + '°'}   播放：扫描入射角`,
    boxX + 10,
    boxY + 34,
    { color: 'rgba(226, 232, 240, 0.88)', font: '11px "Segoe UI", sans-serif' },
  )
}
