import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawAngleMark,
  drawArrow,
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function alphaWorldBounds(): WorldBounds {
  return { xMin: -9.5, xMax: 9.5, yMin: -5.5, yMax: 5.5 }
}

export function drawAlphaFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const b = Number(snap.values.b ?? 1.2)
  const theta = Number(snap.values.theta ?? 0)
  const thetaDeg = Number(snap.values.thetaDeg ?? 0)

  // impact parameter guide: dashed horizontal at y=b from left
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.7)'
  ctx.setLineDash([6, 4])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(sx(world.xMin), sy(b))
  ctx.lineTo(sx(-0.5), sy(b))
  ctx.stroke()
  ctx.setLineDash([])
  drawDimLine(ctx, sx(-7), sy(0), sx(-7), sy(b), `瞄准距 b=${b.toFixed(2)}`, {
    color: 'rgba(167, 139, 250, 0.95)',
    offset: -12,
  })

  // nucleus + soft core hint
  ctx.fillStyle = 'rgba(251, 191, 36, 0.2)'
  ctx.beginPath()
  ctx.arc(sx(0), sy(0), Math.abs(sx(0.6) - sx(0)), 0, Math.PI * 2)
  ctx.fill()
  drawMarker(ctx, sx(0), sy(0), { radius: 9, fill: '#fbbf24', label: '核', labelDx: 10, labelDy: -10 })

  const xs = snap.values.xs
  const ys = snap.values.ys
  const n = Number(snap.values.n ?? 0)
  const idx = Number(snap.values.idx ?? 0)
  if (xs instanceof Float32Array && ys instanceof Float32Array && n > 2) {
    // incoming asymptote arrow
    drawArrow(ctx, sx(xs[0]!), sy(ys[0]!), sx(xs[Math.min(20, n - 1)]!), sy(ys[Math.min(20, n - 1)]!), '#38bdf8', 2)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      if (i === 0) ctx.moveTo(sx(xs[i]!), sy(ys[i]!))
      else ctx.lineTo(sx(xs[i]!), sy(ys[i]!))
    }
    ctx.stroke()

    // outgoing direction
    const i0 = Math.max(0, n - 30)
    drawArrow(
      ctx,
      sx(xs[i0]!),
      sy(ys[i0]!),
      sx(xs[n - 1]!),
      sy(ys[n - 1]!),
      '#f472b6',
      2.2,
    )

    drawMarker(ctx, sx(xs[idx]!), sy(ys[idx]!), {
      radius: 6,
      fill: '#f472b6',
      label: 'α',
      labelDx: 8,
      labelDy: -10,
    })

    // scattering angle from +x to exit velocity
    drawAngleMark(ctx, sx(xs[n - 1]!), sy(ys[n - 1]!), 28, 0, -theta, `θ≈${thetaDeg.toFixed(0)}°`, {
      color: 'rgba(244, 114, 182, 0.95)',
      labelDistance: 42,
    })
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(W - 210, H - 88, 190, 68)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
  ctx.strokeRect(W - 210, H - 88, 190, 68)
  drawDiagramLabel(ctx, '紫虚线=瞄准距离 b', W - 200, H - 68, {
    color: '#a78bfa',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '青线=轨道  粉=α 位置', W - 200, H - 50, {
    color: '#38bdf8',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, 'b↓ → |θ|↑（大角散射）', W - 200, H - 32, {
    color: '#fbbf24',
    font: '11px "Segoe UI", sans-serif',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(580, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
  ctx.strokeRect(12, 10, Math.min(580, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `α 散射 · b=${b.toFixed(2)} · θ≈${thetaDeg.toFixed(1)}° · v₀=${Number(snap.values.v0 ?? 0).toFixed(2)}`,
    22,
    28,
    { color: 'rgba(253, 230, 138, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '减小 b 观察偏转变大；金晕=库仑散射中心', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
