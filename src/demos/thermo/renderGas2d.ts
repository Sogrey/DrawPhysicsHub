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

export function gasWorldBounds(world: number): WorldBounds {
  return {
    xMin: -world,
    xMax: world,
    yMin: -world * 0.75,
    yMax: world * 0.75,
  }
}

export function drawGasFrame(
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

  const boxW = Number(snap.values.boxW ?? 6)
  const boxH = Number(snap.values.boxH ?? 4)
  const N = Number(snap.values.N ?? 40)
  const Ptheory = Number(snap.values.Ptheory ?? 0)
  const Pmeasure = Number(snap.values.Pmeasure ?? 0)
  const vrms = Number(snap.values.vrms ?? 0)
  const hitFlash = Number(snap.values.hitFlash ?? 0)
  const lastHitX = Number(snap.values.lastHitX ?? 0)
  const lastHitY = Number(snap.values.lastHitY ?? 0)
  const xs = snap.values.xs
  const ys = snap.values.ys
  const vxs = snap.values.vxs
  const vys = snap.values.vys

  const hw = boxW / 2
  const hh = boxH / 2

  // 容器
  ctx.fillStyle = 'rgba(56, 189, 248, 0.06)'
  ctx.fillRect(sx(-hw), sy(hh), sx(hw) - sx(-hw), sy(-hh) - sy(hh))
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
  ctx.lineWidth = 2.5
  ctx.strokeRect(sx(-hw), sy(hh), sx(hw) - sx(-hw), sy(-hh) - sy(hh))

  // 测压右壁加粗
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.95)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(sx(hw), sy(hh))
  ctx.lineTo(sx(hw), sy(-hh))
  ctx.stroke()
  drawDiagramLabel(ctx, '测压壁', sx(hw) + 8, sy(hh) - 4, {
    color: 'rgba(244, 114, 182, 0.95)',
  })

  // 辅助尺寸
  drawDimLine(ctx, sx(-hw), sy(-hh - 0.35), sx(hw), sy(-hh - 0.35), `宽=${boxW.toFixed(1)}`, {
    offset: 0,
  })
  drawDimLine(ctx, sx(-hw - 0.35), sy(-hh), sx(-hw - 0.35), sy(hh), `高=${boxH.toFixed(1)}`, {
    offset: -4,
  })

  // 分子
  if (xs instanceof Float32Array && ys instanceof Float32Array) {
    for (let i = 0; i < N && i < xs.length; i++) {
      const px = sx(xs[i]!)
      const py = sy(ys[i]!)
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(px, py, 4.5, 0, Math.PI * 2)
      ctx.fill()
      // 少量速度辅助箭头
      if (i % 8 === 0 && vxs instanceof Float32Array && vys instanceof Float32Array) {
        const vx = vxs[i]!
        const vy = vys[i]!
        const sp = Math.hypot(vx, vy)
        if (sp > 0.2) {
          const s = 0.22
          drawArrow(
            ctx,
            px,
            py,
            sx(xs[i]! + (vx / sp) * s),
            sy(ys[i]! + (vy / sp) * s),
            'rgba(148, 163, 184, 0.55)',
            1.2,
          )
        }
      }
    }
  }

  // 碰撞闪光
  if (hitFlash > 0.05) {
    const a = Math.min(1, hitFlash)
    ctx.fillStyle = `rgba(244, 114, 182, ${0.15 + 0.45 * a})`
    ctx.beginPath()
    ctx.arc(sx(lastHitX), sy(lastHitY), 10 + 8 * a, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(244, 114, 182, ${0.6 + 0.4 * a})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(sx(lastHitX), sy(lastHitY), 12 + 6 * a, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 压强条（右侧）
  const barX = hw + 0.55
  const barH = Math.min(hh * 1.6, 0.15 + Pmeasure * 0.55)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
  ctx.fillRect(sx(barX), sy(hh * 0.85), sx(barX + 0.45) - sx(barX), sy(-hh * 0.85) - sy(hh * 0.85))
  ctx.fillStyle = 'rgba(244, 114, 182, 0.85)'
  ctx.fillRect(
    sx(barX),
    sy(-hh * 0.85) - (sy(-hh * 0.85) - sy(hh * 0.85)) * Math.min(1, barH / (hh * 1.7)),
    sx(barX + 0.45) - sx(barX),
    (sy(-hh * 0.85) - sy(hh * 0.85)) * Math.min(1, barH / (hh * 1.7)),
  )
  drawDiagramLabel(ctx, 'P', sx(barX), sy(hh * 0.85) - 10, {
    color: 'rgba(244, 114, 182, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  // 顶栏
  const boxX = 12
  const boxY = 10
  const boxWpx = Math.min(620, W - 24)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(boxX, boxY, boxWpx, 52)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)'
  ctx.strokeRect(boxX, boxY, boxWpx, 52)
  drawDiagramLabel(ctx, '分子撞壁 → 压强 · P∝n⟨v²⟩（2D 示意）', boxX + 10, boxY + 18, {
    color: 'rgba(125, 211, 252, 0.95)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(
    ctx,
    `P测=${Pmeasure.toFixed(3)}  P论=${Ptheory.toFixed(3)}  v_rms=${vrms.toFixed(2)}  N=${N}  n=${Number(snap.values.n ?? 0).toFixed(2)}`,
    boxX + 10,
    boxY + 38,
    { color: 'rgba(226, 232, 240, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )

  drawDiagramLabel(
    ctx,
    '青框=容器 · 黄点=分子 · 粉边=测压壁 · 播放观察碰撞与压强',
    14,
    H - 14,
    { color: 'rgba(148, 163, 184, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
