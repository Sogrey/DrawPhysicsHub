import { drawArrow } from './primitives2d'

export type ScreenMapper = {
  sx: (x: number) => number
  sy: (y: number) => number
}

/** Draw field-line polylines with direction arrows along the path. */
export function drawArrowedFieldLines(
  ctx: CanvasRenderingContext2D,
  paths: number[][][],
  map: ScreenMapper,
  opts?: {
    strokeStyle?: string
    lineWidth?: number
    arrowEvery?: number
    arrowLen?: number
  },
): void {
  const stroke = opts?.strokeStyle ?? 'rgba(186, 170, 255, 0.78)'
  const lineWidth = opts?.lineWidth ?? 1.35
  const arrowEvery = opts?.arrowEvery ?? 0.85
  const arrowLen = opts?.arrowLen ?? 0.28

  ctx.save()
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const path of paths) {
    if (path.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(map.sx(path[0]![0]!), map.sy(path[0]![1]!))
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(map.sx(path[i]![0]!), map.sy(path[i]![1]!))
    }
    ctx.stroke()

    let dist = 0
    let nextArrow = arrowEvery * 0.55
    for (let i = 1; i < path.length; i++) {
      const x0 = path[i - 1]![0]!
      const y0 = path[i - 1]![1]!
      const x1 = path[i]![0]!
      const y1 = path[i]![1]!
      const seg = Math.hypot(x1 - x0, y1 - y0)
      dist += seg
      if (dist >= nextArrow && seg > 1e-6) {
        const ux = (x1 - x0) / seg
        const uy = (y1 - y0) / seg
        const ax0 = x1 - ux * arrowLen
        const ay0 = y1 - uy * arrowLen
        drawArrow(
          ctx,
          map.sx(ax0),
          map.sy(ay0),
          map.sx(x1),
          map.sy(y1),
          stroke,
          Math.max(1.1, lineWidth),
        )
        nextArrow += arrowEvery
      }
    }
  }
  ctx.restore()
}
