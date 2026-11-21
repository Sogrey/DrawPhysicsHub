import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawArrow,
  drawDiagramLabel,
  drawGridAndAxes2D,
  drawMarker,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'

export function lenzWorldBounds(world: number): WorldBounds {
  return {
    xMin: -world,
    xMax: world,
    yMin: -world,
    yMax: world,
  }
}

function drawBMarks(
  ctx: CanvasRenderingContext2D,
  world: WorldBounds,
  sx: (x: number) => number,
  sy: (y: number) => number,
  B: number,
  side: number,
): void {
  const out = B >= 0
  const alpha = 0.25 + 0.55 * Math.min(1, Math.abs(B) / 1.5)
  const step = Math.max(0.55, side / 3.2)
  const half = side / 2
  ctx.save()
  for (let x = -half + step * 0.4; x <= half; x += step) {
    for (let y = -half + step * 0.4; y <= half; y += step) {
      const px = sx(x)
      const py = sy(y)
      if (out) {
        ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = `rgba(148, 163, 184, ${Math.min(1, alpha + 0.2)})`
        ctx.beginPath()
        ctx.arc(px, py, 1.7, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        const s = 4
        ctx.beginPath()
        ctx.moveTo(px - s, py - s)
        ctx.lineTo(px + s, py + s)
        ctx.moveTo(px + s, py - s)
        ctx.lineTo(px - s, py + s)
        ctx.stroke()
      }
    }
  }
  // faint outside marks
  for (let x = Math.ceil(world.xMin); x <= world.xMax; x += 1.2) {
    for (let y = Math.ceil(world.yMin); y <= world.yMax; y += 1.2) {
      if (Math.abs(x) <= half + 0.2 && Math.abs(y) <= half + 0.2) continue
      const px = sx(x)
      const py = sy(y)
      ctx.fillStyle = `rgba(100, 116, 139, ${0.15 + 0.25 * Math.min(1, Math.abs(B))})`
      ctx.beginPath()
      ctx.arc(px, py, out ? 2 : 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawLoopCurrentArrows(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  half: number,
  sense: number,
  strength: number,
): void {
  if (Math.abs(sense) < 0.5 || strength < 0.05) return
  const s = sense > 0 ? 1 : -1 // +1 CCW
  const edges: [number, number, number, number][] = [
    // bottom: left→right for CCW
    [-half * 0.55, -half, half * 0.55, -half],
    // right: bottom→top for CCW
    [half, -half * 0.55, half, half * 0.55],
    // top: right→left for CCW
    [half * 0.55, half, -half * 0.55, half],
    // left: top→bottom for CCW
    [-half, half * 0.55, -half, -half * 0.55],
  ]
  const alpha = 0.45 + 0.5 * Math.min(1, strength)
  for (const [x0, y0, x1, y1] of edges) {
    if (s > 0) {
      drawArrow(ctx, sx(x0), sy(y0), sx(x1), sy(y1), `rgba(52, 211, 153, ${alpha})`, 2.4)
    } else {
      drawArrow(ctx, sx(x1), sy(y1), sx(x0), sy(y0), `rgba(52, 211, 153, ${alpha})`, 2.4)
    }
  }
}

export function drawLenzFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const { sx, sy, ox, oy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const side = Number(snap.values.side ?? 2)
  const half = side / 2
  const B = Number(snap.values.B ?? 0)
  const Phi = Number(snap.values.Phi ?? 0)
  const emf = Number(snap.values.emf ?? 0)
  const I = Number(snap.values.I ?? 0)
  const sense = Number(snap.values.sense ?? 0)

  drawBMarks(ctx, world, sx, sy, B, side)

  // loop fill hint
  ctx.fillStyle = `rgba(251, 191, 36, ${0.06 + 0.1 * Math.min(1, Math.abs(B))})`
  ctx.fillRect(sx(-half), sy(half), sx(half) - sx(-half), sy(-half) - sy(half))

  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 3
  ctx.strokeRect(sx(-half), sy(half), sx(half) - sx(-half), sy(-half) - sy(half))

  drawLoopCurrentArrows(ctx, sx, sy, half, sense, Math.abs(I))

  drawMarker(ctx, ox, oy, { radius: 3, fill: 'rgba(148,163,184,0.8)', label: 'O' })

  const senseLabel =
    sense > 0.5 ? 'I 逆时针' : sense < -0.5 ? 'I 顺时针' : 'I ≈ 0'
  drawDiagramLabel(
    ctx,
    `${B >= 0 ? 'B 出纸面 (·)' : 'B 入纸面 (×)'}  B=${B.toFixed(2)}`,
    sx(world.xMin) + 8,
    sy(world.yMax) - 8,
    { color: 'rgba(226, 232, 240, 0.9)' },
  )
  drawDiagramLabel(
    ctx,
    `Φ=${Phi.toFixed(2)}  ε=${emf.toFixed(2)}  I=${I.toFixed(2)}  ${senseLabel}`,
    sx(world.xMin) + 8,
    sy(world.yMax) - 28,
    { color: 'rgba(226, 232, 240, 0.88)' },
  )
  drawDiagramLabel(ctx, `A=${Number(snap.values.A ?? 0).toFixed(1)}`, sx(half) + 8, sy(half) - 4, {
    color: 'rgba(251, 191, 36, 0.9)',
  })
}
