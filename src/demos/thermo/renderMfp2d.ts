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

export function mfpWorldBounds(world: number): WorldBounds {
  const w = Math.max(4, world)
  return { xMin: -w, xMax: w, yMin: -w * 0.75, yMax: w * 0.75 }
}

export function drawMfpFrame(host: Canvas2DHost, snap: ObserveSnapshot, world: WorldBounds): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)
  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })

  const boxW = Number(snap.values.boxW ?? 7)
  const boxH = Number(snap.values.boxH ?? 5)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'
  ctx.lineWidth = 2
  ctx.strokeRect(sx(-boxW / 2), sy(boxH / 2), sx(boxW / 2) - sx(-boxW / 2), sy(-boxH / 2) - sy(boxH / 2))

  const lambdaTh = Number(snap.values.lambdaTh ?? 1)
  const lambdaMeas = Number(snap.values.lambdaMeas ?? 0)
  ctx.fillStyle = 'rgba(251, 191, 36, 0.07)'
  ctx.beginPath()
  ctx.arc(sx(0), sy(0), Math.abs(sx(lambdaTh) - sx(0)), 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)'
  ctx.setLineDash([6, 5])
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(sx(0), sy(0), Math.abs(sx(lambdaTh) - sx(0)), 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  if (lambdaTh > 0.2) {
    drawDimLine(ctx, sx(0), sy(0), sx(lambdaTh), sy(0), `λ理=${lambdaTh.toFixed(2)}`, {
      color: 'rgba(251, 191, 36, 0.95)',
      offset: -16,
    })
  }
  drawDimLine(
    ctx,
    sx(-boxW / 2),
    sy(-boxH / 2 - 0.15),
    sx(-boxW / 2 + Number(snap.values.diameter ?? 0.22) * 4),
    sy(-boxH / 2 - 0.15),
    `d×4 示意直径`,
    { color: 'rgba(167, 139, 250, 0.9)', offset: 12 },
  )

  const N = Number(snap.values.N ?? 0)
  const xs = snap.values.xs
  const ys = snap.values.ys
  const trailFlat = snap.values.trailFlat
  const trailLens = snap.values.trailLens
  const diameter = Number(snap.values.diameter ?? 0.22)

  if (
    xs instanceof Float32Array &&
    ys instanceof Float32Array &&
    trailFlat instanceof Float32Array &&
    trailLens instanceof Float32Array
  ) {
    let offset = 0
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
    ctx.lineWidth = 1.2
    for (let i = 0; i < N; i++) {
      const len = Number(trailLens[i] ?? 0)
      if (len >= 2) {
        ctx.beginPath()
        for (let k = 0; k < len; k++) {
          const x = trailFlat[offset + k * 2]!
          const y = trailFlat[offset + k * 2 + 1]!
          if (k === 0) ctx.moveTo(sx(x), sy(y))
          else ctx.lineTo(sx(x), sy(y))
        }
        ctx.stroke()
      }
      offset += len * 2
    }

    const r = Math.abs(sx(diameter / 2) - sx(0))
    for (let i = 0; i < N; i++) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.95)'
      ctx.beginPath()
      ctx.arc(sx(xs[i]!), sy(ys[i]!), Math.max(3, r), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const hitFlash = Number(snap.values.hitFlash ?? 0)
  if (hitFlash > 0.05) {
    ctx.fillStyle = `rgba(244, 114, 182, ${0.25 + 0.5 * hitFlash})`
    ctx.beginPath()
    ctx.arc(
      sx(Number(snap.values.lastHitX ?? 0)),
      sy(Number(snap.values.lastHitY ?? 0)),
      10 + 8 * hitFlash,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  // highlight first particle trail as "one free path"
  if (
    xs instanceof Float32Array &&
    trailFlat instanceof Float32Array &&
    trailLens instanceof Float32Array &&
    Number(trailLens[0] ?? 0) >= 2
  ) {
    const len0 = Number(trailLens[0])
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.95)'
    ctx.lineWidth = 2.4
    ctx.beginPath()
    for (let k = 0; k < len0; k++) {
      const x = trailFlat[k * 2]!
      const y = trailFlat[k * 2 + 1]!
      if (k === 0) ctx.moveTo(sx(x), sy(y))
      else ctx.lineTo(sx(x), sy(y))
    }
    ctx.stroke()
    drawMarker(ctx, sx(xs[0]!), sy(ys instanceof Float32Array ? ys[0]! : 0), {
      radius: 5,
      fill: '#f472b6',
      label: '段长→λ',
      labelDx: 8,
      labelDy: -10,
    })
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(580, W - 24), 48)
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
  ctx.strokeRect(12, 10, Math.min(580, W - 24), 48)
  drawDiagramLabel(
    ctx,
    `平均自由程 · λ理=${lambdaTh.toFixed(2)} · λ测=${lambdaMeas.toFixed(2)} · n↑或 d↑ → λ↓`,
    22,
    28,
    { color: 'rgba(253, 230, 138, 0.98)', font: 'bold 13px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(
    ctx,
    `碰撞=${Math.round(Number(snap.values.collisions ?? 0))}  金圆=λ理  粉轨迹=单粒子自由程段`,
    22,
    46,
    { color: 'rgba(226, 232, 240, 0.88)', font: '11px "Segoe UI", sans-serif' },
  )
}
