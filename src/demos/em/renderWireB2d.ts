import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import { adaptiveFieldDensity } from '@/core/render/adaptiveFieldDensity'
import { drawArrowedFieldLines } from '@/core/render/fieldLines2d'
import {
  drawArrow,
  drawDashedPath,
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function wireBWorldBounds(world: number): WorldBounds {
  // 正方形世界 + isotropic 映射，保证 B 线正圆
  return {
    xMin: -world,
    xMax: world,
    yMin: -world,
    yMax: world,
  }
}

function circlePath(r: number, sense: 1 | -1, n = 72): number[][] {
  const path: number[][] = []
  for (let i = 0; i <= n; i++) {
    const th = sense * ((2 * Math.PI * i) / n)
    path.push([r * Math.cos(th), r * Math.sin(th)])
  }
  return path
}

function drawWireCrossSection(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outOfPage: boolean,
): void {
  ctx.save()
  ctx.fillStyle = '#f87171'
  ctx.beginPath()
  ctx.arc(cx, cy, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(254, 202, 202, 0.95)'
  ctx.lineWidth = 2
  ctx.stroke()
  if (outOfPage) {
    // · out of page
    ctx.fillStyle = '#0b1220'
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // × into page
    ctx.strokeStyle = '#0b1220'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    const s = 5
    ctx.beginPath()
    ctx.moveTo(cx - s, cy - s)
    ctx.lineTo(cx + s, cy + s)
    ctx.moveTo(cx + s, cy - s)
    ctx.lineTo(cx - s, cy + s)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawWireBFrame(
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

  const { sx, sy, ox, oy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })
  const map = { sx, sy }

  const I = Number(snap.values.I ?? 2)
  const R = Number(snap.values.R ?? 2)
  const sense: 1 | -1 = I >= 0 ? 1 : -1
  const dens = adaptiveFieldDensity({ world, pixelW: W, pixelH: H, nSources: 1 })
  const radii = dens.wireRadii.filter((r) => r < world.xMax - 0.15)

  const paths = radii.map((r) => circlePath(r, sense))
  drawArrowedFieldLines(ctx, paths, map, {
    strokeStyle: 'rgba(52, 211, 153, 0.82)',
    lineWidth: dens.lineWidth,
    arrowEvery: dens.arrowEvery * 1.15,
    arrowLen: dens.arrowLen,
  })

  if (opts?.compare?.path?.length) {
    drawDashedPath(ctx, opts.compare.path, map, {
      strokeStyle: 'rgba(244, 114, 182, 0.7)',
      label: opts.compare.label,
    })
  }

  drawWireCrossSection(ctx, ox, oy, I >= 0)
  drawDiagramLabel(ctx, I >= 0 ? 'I 出纸面 (·)' : 'I 入纸面 (×)', ox + 16, oy - 18, {
    color: 'rgba(248, 113, 113, 0.95)',
  })
  drawDiagramLabel(ctx, `I=${I.toFixed(1)} A`, ox + 16, oy + 18, {
    color: 'rgba(226, 232, 240, 0.9)',
  })

  const x = Number(snap.values.x ?? 0)
  const y = Number(snap.values.y ?? 0)
  const Bx = Number(snap.values.Bx ?? 0)
  const By = Number(snap.values.By ?? 0)
  const Bmag = Number(snap.values.Bmag ?? 0)
  const ppx = sx(x)
  const ppy = sy(y)
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(ppx, ppy, 6, 0, Math.PI * 2)
  ctx.fill()

  if (Bmag > 1e-6) {
    const bScale = 0.55 / Math.max(Bmag, 0.4)
    drawArrow(ctx, ppx, ppy, sx(x + Bx * bScale), sy(y + By * bScale), '#f472b6', 2.4)
    drawDiagramLabel(ctx, 'B', sx(x + Bx * bScale) + 4, sy(y + By * bScale) - 4, {
      color: 'rgba(244, 114, 182, 0.95)',
    })
  }

  drawMarker(ctx, ox, oy, { radius: 2, fill: 'rgba(148,163,184,0.5)', label: 'O' })
  drawDiagramLabel(
    ctx,
    `|B|=${Bmag.toFixed(2)}  (=|I|/R=${(Math.abs(I) / Math.max(R, 1e-6)).toFixed(2)})  R=${R.toFixed(1)}`,
    sx(world.xMin) + 8,
    sy(world.yMax) - 8,
    { color: 'rgba(226, 232, 240, 0.9)' },
  )
}
