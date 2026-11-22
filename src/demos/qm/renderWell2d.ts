import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import { wellEnergy } from './well'

export function wellWorldBounds(L: number): WorldBounds {
  const pad = 1.2
  return {
    xMin: -pad,
    xMax: L + pad + 0.5,
    yMin: -1.55,
    yMax: 1.75,
  }
}

export function drawWellFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: false })

  const n = Math.max(1, Math.round(Number(snap.values.n ?? 1)))
  const L = Number(snap.values.L ?? 4)
  const E = Number(snap.values.E ?? wellEnergy(n, L))
  const phase = Number(snap.values.phase ?? 0)
  const phaseDeg = ((phase * 180) / Math.PI) % 360
  const psiArr = snap.values.psi
  const densArr = snap.values.dens
  const reArr = snap.values.re
  const nSamp = Number(snap.values.nSamp ?? 120)

  // —— 顶栏 HUD（先占位，位相钟画在栏内右侧，避免与墙标重叠）——
  const boxX = 12
  const boxY = 10
  const boxH = 56
  const boxW = Math.min(640, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(boxX, boxY, boxW, boxH)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.strokeRect(boxX, boxY, boxW, boxH)
  drawDiagramLabel(ctx, `定态 n=${n} · |ψ|² 不变 · 金线=Reψ(t)`, boxX + 10, boxY + 20, {
    color: 'rgba(196, 181, 253, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `Eₙ=n²π²/(2L²)=${E.toFixed(4)}  节点=${n - 1}  ħ=m=1`,
    boxX + 10,
    boxY + 40,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )

  // 位相钟：贴在 HUD 右侧
  const clockX = boxX + boxW - 78
  const clockY = boxY + boxH / 2
  const cr = 16
  ctx.fillStyle = 'rgba(15, 23, 42, 0.5)'
  ctx.beginPath()
  ctx.arc(clockX, clockY, cr + 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(clockX, clockY, cr, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.98)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(clockX, clockY)
  ctx.lineTo(clockX + cr * Math.cos(-phase), clockY + cr * Math.sin(-phase))
  ctx.stroke()
  drawDiagramLabel(ctx, `φ ${phaseDeg.toFixed(0)}°`, clockX + cr + 6, clockY + 4, {
    color: 'rgba(251, 191, 36, 0.98)',
    font: 'bold 11px "Segoe UI", sans-serif',
  })

  // 势阱壁（标签放在墙外中部，躲开顶栏）
  ctx.fillStyle = 'rgba(148, 163, 184, 0.28)'
  ctx.fillRect(sx(world.xMin), sy(world.yMax), sx(0) - sx(world.xMin), sy(world.yMin) - sy(world.yMax))
  ctx.fillRect(sx(L), sy(world.yMax), sx(world.xMax) - sx(L), sy(world.yMin) - sy(world.yMax))
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.95)'
  ctx.lineWidth = 3.5
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(world.yMin))
  ctx.lineTo(sx(0), sy(world.yMax))
  ctx.moveTo(sx(L), sy(world.yMin))
  ctx.lineTo(sx(L), sy(world.yMax))
  ctx.stroke()
  drawDiagramLabel(ctx, 'V=∞', sx(0) - 36, sy(0.15), { color: 'rgba(203, 213, 225, 0.95)' })
  drawDiagramLabel(ctx, 'V=∞', sx(L) + 8, sy(0.15), { color: 'rgba(203, 213, 225, 0.95)' })
  drawDiagramLabel(ctx, '阱内 V=0', sx(L / 2) - 28, sy(-1.38), {
    color: 'rgba(148, 163, 184, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDimLine(ctx, sx(0), sy(-1.18), sx(L), sy(-1.18), `L=${L.toFixed(2)}`, { offset: 0 })

  // 零线
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(sx(0), sy(0))
  ctx.lineTo(sx(L), sy(0))
  ctx.stroke()

  // |ψ|²（纵轴只比形状，与 ψ 同屏对照）
  let densPeakX = L / 2
  let densPeakY = 0
  if (densArr instanceof Float32Array) {
    ctx.fillStyle = 'rgba(167, 139, 250, 0.22)'
    ctx.beginPath()
    ctx.moveTo(sx(0), sy(0))
    for (let i = 0; i < nSamp; i++) {
      const x = (L * i) / Math.max(1, nSamp - 1)
      const y = densArr[i]! * 2.2
      if (y > densPeakY) {
        densPeakY = y
        densPeakX = x
      }
      ctx.lineTo(sx(x), sy(y))
    }
    ctx.lineTo(sx(L), sy(0))
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.95)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < nSamp; i++) {
      const x = (L * i) / Math.max(1, nSamp - 1)
      const y = densArr[i]! * 2.2
      if (i === 0) ctx.moveTo(sx(x), sy(y))
      else ctx.lineTo(sx(x), sy(y))
    }
    ctx.stroke()
    drawDiagramLabel(ctx, '|ψ|²', sx(densPeakX) - 14, sy(densPeakY) - 12, {
      color: 'rgba(196, 181, 253, 0.98)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  }

  // ψₙ 静止包络（虚线）
  let psiPeakX = L / 2
  let psiPeakY = 0
  if (psiArr instanceof Float32Array) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
    ctx.lineWidth = 2.2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    for (let i = 0; i < nSamp; i++) {
      const x = (L * i) / Math.max(1, nSamp - 1)
      const y = psiArr[i]!
      if (Math.abs(y) > Math.abs(psiPeakY)) {
        psiPeakY = y
        psiPeakX = x
      }
      if (i === 0) ctx.moveTo(sx(x), sy(y))
      else ctx.lineTo(sx(x), sy(y))
    }
    ctx.stroke()
    ctx.setLineDash([])
    drawDiagramLabel(ctx, 'ψₙ', sx(psiPeakX) + 8, sy(psiPeakY) + 4, {
      color: 'rgba(56, 189, 248, 0.95)',
      font: 'bold 11px "Segoe UI", sans-serif',
    })
  }

  // Re ψ(t)
  let rePeakX = L / 2
  let rePeakY = 0
  if (reArr instanceof Float32Array) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.98)'
    ctx.lineWidth = 2.6
    ctx.beginPath()
    for (let i = 0; i < nSamp; i++) {
      const x = (L * i) / Math.max(1, nSamp - 1)
      const y = reArr[i]!
      if (Math.abs(y) > Math.abs(rePeakY)) {
        rePeakY = y
        rePeakX = x
      }
      if (i === 0) ctx.moveTo(sx(x), sy(y))
      else ctx.lineTo(sx(x), sy(y))
    }
    ctx.stroke()
    drawDiagramLabel(ctx, 'Reψ(t)', sx(rePeakX) - 22, sy(rePeakY) + (rePeakY >= 0 ? -12 : 16), {
      color: 'rgba(251, 191, 36, 0.98)',
      font: 'bold 12px "Segoe UI", sans-serif',
    })
  }

  // 节点
  for (let k = 1; k < n; k++) {
    const xn = (k * L) / n
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.85)'
    ctx.lineWidth = 1.4
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(sx(xn), sy(-0.35))
    ctx.lineTo(sx(xn), sy(0.35))
    ctx.stroke()
    ctx.setLineDash([])
    drawDiagramLabel(ctx, '节点', sx(xn) - 12, sy(0.48), {
      color: 'rgba(248, 113, 113, 0.9)',
      font: '10px "Segoe UI", sans-serif',
    })
  }

  // 能级条（右侧）
  const eMax = wellEnergy(5, L)
  const ladderX0 = L + 0.4
  const ladderX1 = L + 1.0
  drawDiagramLabel(ctx, '能级', sx(ladderX0), sy(1.55), {
    color: 'rgba(226, 232, 240, 0.9)',
    font: '11px "Segoe UI", sans-serif',
  })
  for (let k = 1; k <= 5; k++) {
    const Ek = wellEnergy(k, L)
    const y = 1.35 - (Ek / eMax) * 1.15
    ctx.strokeStyle = k === n ? 'rgba(251, 191, 36, 0.98)' : 'rgba(100, 116, 139, 0.75)'
    ctx.lineWidth = k === n ? 3 : 1.3
    ctx.beginPath()
    ctx.moveTo(sx(ladderX0), sy(y))
    ctx.lineTo(sx(ladderX1), sy(y))
    ctx.stroke()
    drawDiagramLabel(ctx, `n=${k}`, sx(ladderX1) + 4, sy(y) + 4, {
      color: k === n ? 'rgba(251, 191, 36, 0.98)' : 'rgba(148, 163, 184, 0.8)',
      font: '10px "Segoe UI", sans-serif',
    })
  }

  drawDiagramLabel(
    ctx,
    '青虚线=ψₙ · 紫=|ψ|² · 金=Reψ(t) · 右=能级 · 顶栏钟=位相 φ',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.92)', font: '11px "Segoe UI", sans-serif' },
  )
}
