import type { CompareTrail } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawDimLine,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import {
  drawCircularWavefronts,
  drawIntensityCurvePanel,
  drawPathDifferenceCallout,
  drawPlaneWaveArrows,
  paintCoherentIntensityField,
  type PointSource,
} from './wavefronts2d'

export function diffractionWorldBounds(worldX: number, worldY: number): WorldBounds {
  return {
    xMin: -2.8,
    xMax: worldX + 2.2,
    yMin: -worldY,
    yMax: worldY,
  }
}

/** Huygens secondary sources across slit width a */
function huygensSources(slitX: number, a: number, n = 7): PointSource[] {
  const half = a / 2
  const out: PointSource[] = []
  for (let i = 0; i < n; i++) {
    const y = -half + (a * i) / Math.max(1, n - 1)
    out.push({ x: slitX, y })
  }
  return out
}

export function drawDiffractionFrame(
  host: Canvas2DHost,
  snap: ObserveSnapshot,
  world: WorldBounds,
  _opts?: { compare?: CompareTrail | null },
): void {
  const { ctx, canvas } = host
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  host.clear()
  fillDarkViewport(ctx, W, H)

  const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H, { isotropic: true })
  const map = { sx, sy }

  const a = Number(snap.values.a ?? 1)
  const L = Number(snap.values.L ?? 6)
  const lambda = Number(snap.values.lambda ?? 0.5)
  const y1 = Number(snap.values.y1 ?? 1)
  const yMax = Number(snap.values.yMax ?? 4)
  const nScreen = Number(snap.values.nScreen ?? 140)
  const screenI = snap.values.screenI
  const half = a / 2
  const slitX = 0
  const screenX = L
  const t = Number(snap.time ?? 0)
  const period = Number(snap.values.period ?? 6)
  const phaseLen = ((t / period) * lambda * 5) % lambda
  const phaseRad = (2 * Math.PI * t) / period

  const sources = huygensSources(slitX, a, 9)

  // incident plane waves
  drawPlaneWaveArrows(ctx, map, {
    x0: -2.4,
    x1: -0.35,
    yMin: -Math.min(yMax * 0.55, 2.2),
    yMax: Math.min(yMax * 0.55, 2.2),
    rows: 6,
    strokeStyle: 'rgba(74, 222, 128, 0.85)',
  })
  drawDiagramLabel(ctx, '① 入射平面波', sx(-2.35), sy(Math.min(yMax * 0.55, 2.2)) - 10, {
    color: 'rgba(74, 222, 128, 0.9)',
  })

  // ② 惠更斯次波源相干叠加 → 空间衍射光场
  paintCoherentIntensityField(ctx, map, sources, {
    lambda,
    phaseRad,
    x0: slitX + 0.12,
    x1: screenX - 0.08,
    y0: -yMax * 0.92,
    y1: yMax * 0.92,
    nx: 84,
    ny: 66,
    tint: 'green',
    alpha: 0.75,
  })

  // faint wavefront arcs from slit center
  drawCircularWavefronts(ctx, map, slitX, 0, {
    lambda,
    phase: phaseLen,
    rMin: lambda * 0.45,
    rMax: Math.min(L * 0.5, 3),
    strokeStyle: 'rgba(187, 247, 208, 0.4)',
    lineWidth: 1.2,
    startAngle: -1.0,
    endAngle: 1.0,
  })

  // barrier + slit + Huygens markers
  ctx.fillStyle = 'rgba(71, 85, 105, 0.96)'
  const bx0 = sx(slitX - 0.12)
  const bx1 = sx(slitX + 0.12)
  ctx.fillRect(bx0, sy(world.yMax), bx1 - bx0, sy(half) - sy(world.yMax))
  ctx.fillRect(bx0, sy(-half), bx1 - bx0, sy(world.yMin) - sy(-half))
  ctx.fillStyle = 'rgba(248, 113, 113, 0.3)'
  ctx.fillRect(sx(slitX - 0.06), sy(half), sx(slitX + 0.06) - sx(slitX - 0.06), sy(-half) - sy(half))
  for (const s of sources) {
    ctx.fillStyle = '#f87171'
    ctx.beginPath()
    ctx.arc(sx(s.x), sy(s.y), 3, 0, Math.PI * 2)
    ctx.fill()
  }
  drawDimLine(ctx, sx(slitX), sy(-half), sx(slitX), sy(half), `a=${a.toFixed(2)}`, { offset: -18 })
  drawDiagramLabel(ctx, '② 惠更斯次波源', sx(slitX) + 12, sy(half) + 4, {
    color: 'rgba(248, 113, 113, 0.9)',
  })

  // fringe strip
  const fringeW = Math.max(28, sx(screenX + 0.85) - sx(screenX))
  if (screenI instanceof Float32Array) {
    for (let i = 0; i < nScreen; i++) {
      const y0 = -yMax + (2 * yMax * i) / Math.max(1, nScreen - 1)
      const y1b = -yMax + (2 * yMax * (i + 1)) / Math.max(1, nScreen - 1)
      const I = screenI[i]!
      const g = Math.floor(30 + 220 * I)
      ctx.fillStyle = `rgb(${Math.floor(g * 0.25)}, ${g}, ${Math.floor(g * 0.35)})`
      ctx.fillRect(sx(screenX), sy(y1b), fringeW, Math.max(1, sy(y0) - sy(y1b)))
    }
  }
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(sx(screenX), sy(yMax), fringeW, sy(-yMax) - sy(yMax))
  drawDiagramLabel(ctx, '③ 屏上条纹', sx(screenX) + 4, sy(yMax) - 6, {
    color: 'rgba(74, 222, 128, 0.9)',
  })

  if (screenI instanceof Float32Array) {
    drawIntensityCurvePanel(ctx, map, {
      x0: screenX + 1.1,
      width: 1.8,
      yMin: -yMax,
      yMax,
      values: screenI,
      strokeStyle: 'rgba(74, 222, 128, 0.95)',
      fillStyle: 'rgba(74, 222, 128, 0.12)',
      label: 'I(y)∝sinc²',
      probeY: Number(snap.values.y ?? 0),
      probeI: Number(snap.values.I ?? 0),
    })
  }

  // first minima
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)'
  ctx.setLineDash([5, 4])
  ctx.lineWidth = 1.4
  for (const ym of [y1, -y1]) {
    if (Math.abs(ym) > yMax) continue
    ctx.beginPath()
    ctx.moveTo(sx(screenX - 0.15), sy(ym))
    ctx.lineTo(sx(screenX) + fringeW + 8, sy(ym))
    ctx.stroke()
  }
  ctx.setLineDash([])
  if (y1 < yMax) {
    drawDimLine(ctx, sx(screenX + 0.55), sy(0), sx(screenX + 0.55), sy(y1), `y₁=${y1.toFixed(2)}`, {
      offset: 12,
    })
  }

  // probe: edge vs center of slit → path difference across aperture
  const yProbe = Number(snap.values.y ?? 0)
  const I = Number(snap.values.I ?? 0)
  const edgeSources = [sources[0]!, sources[sources.length - 1]!]
  const r1 = Math.hypot(screenX - edgeSources[0].x, yProbe - edgeSources[0].y)
  const r2 = Math.hypot(screenX - edgeSources[1].x, yProbe - edgeSources[1].y)
  const deltaEdge = r1 - r2
  const phiDeg = ((deltaEdge / lambda) * 360) % 360

  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(sx(screenX) + fringeW * 0.45, sy(yProbe), 6, 0, Math.PI * 2)
  ctx.fill()
  drawPathDifferenceCallout(ctx, map, {
    sources: edgeSources,
    probe: { x: screenX, y: yProbe },
    lambda,
    delta: deltaEdge,
    phiDeg: phiDeg > 180 ? phiDeg - 360 : phiDeg,
    I,
  })

  drawDiagramLabel(
    ctx,
    '原理：缝内各次波相干叠加；边缘光程差≈λ 时相消 → 第一暗纹 y₁=λL/a；中央宽≈2y₁',
    sx(world.xMin) + 8,
    sy(world.yMax) - 8,
    { color: 'rgba(226, 232, 240, 0.88)', font: '11px "Segoe UI", sans-serif' },
  )
  drawDiagramLabel(
    ctx,
    `λ=${lambda.toFixed(2)}  L=${L.toFixed(1)}  中央宽=${Number(snap.values.centralWidth ?? 0).toFixed(2)}  播放看波场形成`,
    sx(world.xMin) + 8,
    sy(world.yMax) - 26,
    { color: 'rgba(148, 163, 184, 0.9)', font: '11px "Segoe UI", sans-serif' },
  )
}
