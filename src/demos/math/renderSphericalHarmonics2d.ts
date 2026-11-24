import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import {
  drawDiagramLabel,
  drawGridAndAxes2D,
  fillDarkViewport,
  type WorldBounds,
} from '@/core/render/primitives2d'
import { realYlm } from './sphericalHarmonics'

export function sphericalHarmonicsWorldBounds(world: number): WorldBounds {
  const w = Math.max(3, world)
  return { xMin: -w, xMax: w, yMin: -w, yMax: w }
}

export function drawSphericalHarmonicsFrame(
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

  const L = Number(snap.values.L ?? 1)
  const M = Number(snap.values.M ?? 0)
  const yaw = (Number(snap.values.yaw ?? 0) * Math.PI) / 180

  // xz slice (φ=yaw)
  ctx.beginPath()
  let started = false
  for (let i = 0; i <= 180; i++) {
    const th = (Math.PI * i) / 180
    const yv = realYlm(L, M, th, yaw)
    const r = 1.1 + 1.1 * Math.abs(yv)
    const x = r * Math.sin(th)
    const y = r * Math.cos(th)
    const col = yv >= 0 ? 'rgba(56,189,248,0.9)' : 'rgba(244,114,182,0.9)'
    if (!started) {
      ctx.strokeStyle = col
      ctx.lineWidth = 2.5
      ctx.moveTo(sx(x), sy(y))
      started = true
    } else {
      ctx.lineTo(sx(x), sy(y))
    }
  }
  ctx.stroke()
  // mirror negative x for |m| visualization at φ+π
  ctx.beginPath()
  for (let i = 0; i <= 180; i++) {
    const th = (Math.PI * i) / 180
    const yv = realYlm(L, M, th, yaw + Math.PI)
    const r = 1.1 + 1.1 * Math.abs(yv)
    const x = -r * Math.sin(th)
    const y = r * Math.cos(th)
    if (i === 0) ctx.moveTo(sx(x), sy(y))
    else ctx.lineTo(sx(x), sy(y))
  }
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.fillRect(12, 10, Math.min(420, W - 24), 48)
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)'
  ctx.strokeRect(12, 10, Math.min(420, W - 24), 48)
  drawDiagramLabel(ctx, `球谐 · Yₗₘ  l=${L}  m=${M}`, 22, 28, {
    color: 'rgba(196, 181, 253, 0.98)',
    font: 'bold 13px "Segoe UI", sans-serif',
  })
  drawDiagramLabel(ctx, '截面：青/粉=正负叶；播放旋转 φ', 22, 46, {
    color: 'rgba(226, 232, 240, 0.88)',
    font: '11px "Segoe UI", sans-serif',
  })
}
