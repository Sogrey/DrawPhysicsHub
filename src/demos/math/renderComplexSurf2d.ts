import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import { complexF } from './complexSurf'

export function complexSurfWorldBounds(): WorldBounds {
  return { xMin: -2.4, xMax: 2.4, yMin: -2.4, yMax: 2.4 }
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`
}

export function drawComplexSurfFrame(
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
  const cell = Math.max(2, Math.abs(sx(0.12) - sx(0)) * 0.9)

  const kind = Number(snap.values.kind ?? 1)
  const step = 0.12
  for (let x = world.xMin; x <= world.xMax; x += step) {
    for (let y = world.yMin; y <= world.yMax; y += step) {
      const f = complexF(x, y, kind)
      const lit = Math.min(72, 18 + 18 * Math.min(3, f.mod))
      ctx.fillStyle = hsl((f.arg * 180) / Math.PI, 70, lit)
      ctx.fillRect(sx(x) - cell / 2, sy(y) - cell / 2, cell, cell)
    }
  }

  const px = Number(snap.values.px ?? 0)
  const py = Number(snap.values.py ?? 0)
  drawMarker(ctx, sx(px), sy(py), { radius: 6, fill: '#fbbf24', label: 'z', labelDx: 8 })

  const label = kind >= 1.5 ? 'f=1/z' : 'f=z²'
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'
  ctx.strokeRect(12, 10, Math.min(480, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `复函数 · ${label}  |f|=${Number(snap.values.mod ?? 0).toFixed(2)}  arg=${Number(snap.values.argDeg ?? 0).toFixed(0)}°`,
    22,
    28,
    { color: 'rgba(253, 230, 138, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(ctx, '色相=arg，亮度∝|f|；金点沿 |z|=1.2 圆周', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
