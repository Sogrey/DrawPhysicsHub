import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function dopplerWorldBounds(): WorldBounds {
  return { xMin: -5, xMax: 6, yMin: -4.5, yMax: 4.5 }
}

export function drawDopplerFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const rings = snap.trails?.path
  if (rings) {
    ctx.strokeStyle = 'rgba(56,189,248,0.55)'
    ctx.lineWidth = 1.5
    for (const r of rings) {
      const rad = Math.abs(sx(r[0]! + r[1]!) - sx(r[0]!))
      ctx.beginPath()
      ctx.arc(sx(r[0]!), sy(0), rad, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  drawMarker(ctx, sx(Number(snap.values.xS ?? 0)), sy(0), {
    radius: 7,
    fill: '#fbbf24',
    label: '源',
    labelDx: 8,
  })
  drawMarker(ctx, sx(5), sy(0), { radius: 5, fill: '#4ade80', label: '观测', labelDx: 8 })

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(500, W - 24), 48)
  ctx.strokeStyle = 'rgba(251,191,36,0.45)'
  ctx.strokeRect(12, 10, Math.min(500, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `多普勒 · f_迎=${Number(snap.values.fApp ?? 0).toFixed(2)}  f_远=${Number(snap.values.fRec ?? 0).toFixed(2)}  vs/c=${Number(snap.values.Mach ?? 0).toFixed(2)}`,
    22,
    28,
    { color: 'rgba(253,230,138,0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '前方波前密→频率高；绿=观察者位置示意', 22, 46, {
    color: 'rgba(226,232,240,0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
