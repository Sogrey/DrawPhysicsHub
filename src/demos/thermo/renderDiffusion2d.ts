import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function diffusionWorldBounds(): WorldBounds {
  return { xMin: -5.2, xMax: 5.2, yMin: -3.8, yMax: 3.8 }
}

export function drawDiffusionFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const R = Math.sqrt(Math.max(0, Number(snap.values.r2Theory ?? 0)))
  const rMeas = Math.sqrt(Math.max(0, Number(snap.values.r2 ?? 0)))
  const t = Number(snap.values.t ?? snap.time ?? 0)
  const D = Number(snap.values.D ?? 0.35)

  // theory disk fill
  ctx.fillStyle = 'rgba(251, 191, 36, 0.08)'
  ctx.beginPath()
  ctx.arc(sx(0), sy(0), Math.abs(sx(R) - sx(0)), 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)'
  ctx.setLineDash([6, 4])
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(sx(0), sy(0), Math.abs(sx(R) - sx(0)), 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // measured rms circle
  if (rMeas > 0.05) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)'
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.arc(sx(0), sy(0), Math.abs(sx(rMeas) - sx(0)), 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // radius dim from origin to theory circle
  if (R > 0.15) {
    drawDimLine(ctx, sx(0), sy(0), sx(R), sy(0), `√(4Dt)=${R.toFixed(2)}`, {
      color: 'rgba(251, 191, 36, 0.95)',
      offset: -18,
    })
  }

  drawMarker(ctx, sx(0), sy(0), {
    radius: 5,
    fill: '#f472b6',
    label: '起点',
    labelDx: 8,
    labelDy: -10,
  })

  const N = Number(snap.values.N ?? 0)
  const xs = snap.values.xs
  const ys = snap.values.ys
  if (xs instanceof Float32Array && ys instanceof Float32Array) {
    // highlight particle 0 with spoke to origin
    if (N > 0) {
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)'
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(sx(0), sy(0))
      ctx.lineTo(sx(xs[0]!), sy(ys[0]!))
      ctx.stroke()
      ctx.setLineDash([])
      drawMarker(ctx, sx(xs[0]!), sy(ys[0]!), {
        radius: 5,
        fill: '#f472b6',
        label: '样例粒子',
        labelDx: 8,
        labelDy: -8,
      })
    }
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)'
    for (let i = 1; i < N; i++) {
      ctx.beginPath()
      ctx.arc(sx(xs[i]!), sy(ys[i]!), 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // legend box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(W - 200, H - 88, 180, 68)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
  ctx.strokeRect(W - 200, H - 88, 180, 68)
  drawDiagramLabel(ctx, '金虚线圆 = √(4Dt)', W - 190, H - 68, {
    color: 'rgba(251, 191, 36, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '青虚线圆 = √⟨r²⟩测', W - 190, H - 50, {
    color: 'rgba(56, 189, 248, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '粉点 = 样例位移', W - 190, H - 32, {
    color: 'rgba(244, 114, 182, 0.95)',
    font: '11px "Segoe UI", sans-serif',
  })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(560, W - 24), 48)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
  ctx.strokeRect(12, 10, Math.min(560, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `扩散 · t=${t.toFixed(2)}  D=${D.toFixed(2)}  ⟨r²⟩=${Number(snap.values.r2 ?? 0).toFixed(2)}  4Dt=${Number(snap.values.r2Theory ?? 0).toFixed(2)}`,
    22,
    28,
    { color: 'rgba(186, 230, 253, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '播放：粒子云外扩；金圆半径 ∝ √t（对照斜率看 D）', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
