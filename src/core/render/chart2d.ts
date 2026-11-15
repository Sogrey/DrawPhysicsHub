import type { ObserveSnapshot } from '@/core/physics/types'

export interface ChartSeries {
  t: number[]
  y: number[]
}

export function createEmptySeries(): ChartSeries {
  return { t: [], y: [] }
}

export function pushSample(series: ChartSeries, snap: ObserveSnapshot, key = 'y', maxPoints = 2000): void {
  series.t.push(snap.time)
  series.y.push(Number(snap.values[key] ?? 0))
  if (series.t.length > maxPoints) {
    series.t.shift()
    series.y.shift()
  }
}

/** Minimal canvas line chart (no ECharts dependency in M1). */
export function drawLineChart(
  canvas: HTMLCanvasElement,
  series: ChartSeries,
  opts?: { yLabel?: string; color?: string },
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth || 640
  const H = canvas.clientHeight || 240
  canvas.width = Math.floor(W * dpr)
  canvas.height = Math.floor(H * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1220')
  bg.addColorStop(1, '#111827')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const pad = 40
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)'
  ctx.strokeRect(pad, 16, W - pad - 16, H - pad - 8)

  ctx.fillStyle = 'rgba(148, 163, 184, 0.85)'
  ctx.font = '12px "Segoe UI", sans-serif'
  ctx.fillText(opts?.yLabel ?? 'y', 10, 28)
  ctx.fillText('t', W - 22, H - 14)

  if (series.t.length < 2) return

  let yMin = Infinity
  let yMax = -Infinity
  for (const v of series.y) {
    yMin = Math.min(yMin, v)
    yMax = Math.max(yMax, v)
  }
  if (yMin === yMax) {
    yMin -= 1
    yMax += 1
  }
  const t0 = series.t[0]!
  const t1 = series.t[series.t.length - 1]!
  const xOf = (t: number) => pad + ((t - t0) / Math.max(1e-9, t1 - t0)) * (W - pad - 16)
  const yOf = (y: number) => 16 + (1 - (y - yMin) / (yMax - yMin)) * (H - pad - 8)

  // zero line if in range
  if (yMin < 0 && yMax > 0) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
    ctx.beginPath()
    ctx.moveTo(pad, yOf(0))
    ctx.lineTo(W - 16, yOf(0))
    ctx.stroke()
  }

  ctx.strokeStyle = opts?.color ?? '#38bdf8'
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(xOf(series.t[0]!), yOf(series.y[0]!))
  for (let i = 1; i < series.t.length; i++) {
    ctx.lineTo(xOf(series.t[i]!), yOf(series.y[i]!))
  }
  ctx.stroke()

  const lastX = xOf(series.t[series.t.length - 1]!)
  const lastY = yOf(series.y[series.y.length - 1]!)
  ctx.fillStyle = '#f97316'
  ctx.beginPath()
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
  ctx.fill()
}
