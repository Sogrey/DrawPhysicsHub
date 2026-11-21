import type { WorldBounds } from './primitives2d'

export type AdaptiveFieldDensity = {
  /** 每电荷场线数 */
  linesPerCharge: number
  /** 场线上箭头间距（世界单位） */
  arrowEvery: number
  /** 箭头长度（世界单位） */
  arrowLen: number
  /** 积分步长 */
  step: number
  lineWidth: number
  /** 直导线同心圆半径列表（世界单位） */
  wireRadii: number[]
}

/**
 * 按视口像素与世界跨度自适应场线/箭头密度（M5-13）。
 * 目标：箭头约每 45–55 px 一枚；小屏减线、大屏加密，避免过密掉帧。
 */
export function adaptiveFieldDensity(opts: {
  world: WorldBounds
  pixelW: number
  pixelH: number
  nSources?: number
}): AdaptiveFieldDensity {
  const { world, pixelW, pixelH } = opts
  const nSources = Math.max(1, opts.nSources ?? 1)
  const spanX = Math.max(1e-6, world.xMax - world.xMin)
  const spanY = Math.max(1e-6, world.yMax - world.yMin)
  const span = Math.min(spanX, spanY)
  const shortPx = Math.max(120, Math.min(pixelW, pixelH))
  // isotropic 填满短边时的近似：世界单位 / 像素
  const worldPerPx = span / shortPx

  const targetArrowPx = shortPx < 420 ? 56 : shortPx < 720 ? 50 : 44
  let arrowEvery = targetArrowPx * worldPerPx
  arrowEvery = Math.min(1.6, Math.max(0.45, arrowEvery))

  let arrowLen = Math.min(0.42, Math.max(0.16, 0.55 * arrowEvery))
  let lineWidth = shortPx < 480 ? 1.2 : shortPx < 800 ? 1.4 : 1.55

  // 线数：随像素增，随源数略减
  const baseLines = Math.round(shortPx / 52)
  let linesPerCharge = Math.round(baseLines / Math.sqrt(nSources))
  linesPerCharge = Math.min(20, Math.max(8, linesPerCharge))

  const step = Math.min(0.07, Math.max(0.035, arrowEvery * 0.06))

  // 直导线：圆数量随短边像素变化
  const nRings = Math.min(8, Math.max(4, Math.round(shortPx / 110)))
  const rMax = span * 0.42
  const rMin = span * 0.08
  const wireRadii: number[] = []
  for (let i = 0; i < nRings; i++) {
    const u = (i + 1) / (nRings + 0.35)
    wireRadii.push(rMin + (rMax - rMin) * u)
  }

  return { linesPerCharge, arrowEvery, arrowLen, step, lineWidth, wireRadii }
}
