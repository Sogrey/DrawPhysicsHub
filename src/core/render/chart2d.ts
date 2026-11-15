import type { DemoChartPanel, DemoChartSeriesDef, ObserveSnapshot } from '@/core/physics/types'

export interface ChartSeries {
  t: number[]
  y: number[]
}

/** 多系列共享横轴的采样结果 */
export interface MultiSeriesData {
  t: number[]
  /** key → y 值序列，与 t 等长 */
  series: Record<string, number[]>
}

export function createEmptySeries(): ChartSeries {
  return { t: [], y: [] }
}

export function createEmptyMultiSeries(): MultiSeriesData {
  return { t: [], series: {} }
}

export function pushSample(
  series: ChartSeries,
  snap: ObserveSnapshot,
  key = 'y',
  maxPoints = 2000,
): void {
  series.t.push(snap.time)
  series.y.push(Number(snap.values[key] ?? 0))
  if (series.t.length > maxPoints) {
    series.t.shift()
    series.y.shift()
  }
}

export function pushMultiSample(
  data: MultiSeriesData,
  snap: ObserveSnapshot,
  keys: string[],
  maxPoints = 4000,
): void {
  data.t.push(snap.time)
  for (const key of keys) {
    if (!data.series[key]) data.series[key] = []
    data.series[key]!.push(Number(snap.values[key] ?? 0))
  }
  if (data.t.length > maxPoints) {
    data.t.shift()
    for (const key of keys) data.series[key]?.shift()
  }
}

function nicePad(min: number, max: number): [number, number] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [-1, 1]
  if (min === max) return [min - 1, max + 1]
  const span = max - min
  const pad = span * 0.08
  return [min - pad, max + pad]
}

function axisRange(values: number[]): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (const v of values) {
    if (!Number.isFinite(v)) continue
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  return nicePad(lo, hi)
}

function collectAxisValues(
  data: MultiSeriesData,
  defs: DemoChartSeriesDef[],
  side: 'left' | 'right',
): number[] {
  const out: number[] = []
  for (const def of defs) {
    if ((def.axis ?? 'left') !== side) continue
    const ys = data.series[def.key]
    if (ys) out.push(...ys)
  }
  return out
}

type PanelLayout = { padL: number; padR: number; padT: number; padB: number }

function drawPanelFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  panel: DemoChartPanel,
  hasRight: boolean,
  layout: PanelLayout,
): { plotL: number; plotT: number; plotW: number; plotH: number } {
  const { padL, padR, padT, padB } = layout
  const plotL = x + padL
  const plotT = y + padT
  const plotW = w - padL - padR
  const plotH = h - padT - padB

  ctx.fillStyle = 'rgba(148, 163, 184, 0.95)'
  ctx.font = '600 12px "Segoe UI", sans-serif'
  ctx.fillText(panel.title, x + 10, y + 16)

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)'
  ctx.strokeRect(plotL, plotT, plotW, plotH)

  ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'
  ctx.font = '11px "Segoe UI", sans-serif'
  if (panel.leftLabel) {
    ctx.save()
    ctx.translate(x + 14, plotT + plotH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText(panel.leftLabel, 0, 0)
    ctx.restore()
  }
  if (hasRight && panel.rightLabel) {
    ctx.save()
    ctx.translate(x + w - 14, plotT + plotH / 2)
    ctx.rotate(Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText(panel.rightLabel, 0, 0)
    ctx.restore()
  }
  ctx.fillText(panel.xLabel ?? 't', plotL + plotW - 10, y + h - 8)

  return { plotL, plotT, plotW, plotH }
}

/** 可见前缀终点下标：t[i] <= untilT；不足 2 点则曲线不画 */
function revealEndIndex(data: MultiSeriesData, untilT: number | undefined): number {
  if (untilT == null) return data.t.length
  let end = 0
  for (let i = 0; i < data.t.length; i++) {
    if (data.t[i]! <= untilT + 1e-9) end = i + 1
    else break
  }
  return end
}

function drawSeriesLine(
  ctx: CanvasRenderingContext2D,
  data: MultiSeriesData,
  def: DemoChartSeriesDef,
  xOf: (t: number) => number,
  yOf: (v: number) => number,
  endIdx: number,
): void {
  const ys = data.series[def.key]
  if (!ys || endIdx < 2) return

  ctx.strokeStyle = def.color
  ctx.lineWidth = 2.2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(xOf(data.t[0]!), yOf(ys[0]!))
  for (let i = 1; i < endIdx; i++) {
    ctx.lineTo(xOf(data.t[i]!), yOf(ys[i]!))
  }
  ctx.stroke()

  const tip = endIdx - 1
  ctx.fillStyle = def.color
  ctx.beginPath()
  ctx.arc(xOf(data.t[tip]!), yOf(ys[tip]!), 3.5, 0, Math.PI * 2)
  ctx.fill()
}

export interface ChartDrawOpts {
  /** 播放头时间；与 revealUntil 同步时作竖线 */
  cursorT?: number
  /**
   * 只绘制 t ≤ revealUntil 的曲线段（随播放增长）。
   * 横纵轴仍按全量采样定标，避免尺度跳动。
   */
  revealUntil?: number
  /** 堆叠时统一边距，保证各图横轴对齐 */
  layout?: PanelLayout
}

/** 在指定矩形内绘制一个双纵轴多系列面板 */
export function drawChartPanel(
  ctx: CanvasRenderingContext2D,
  data: MultiSeriesData,
  panel: DemoChartPanel,
  rect: { x: number; y: number; w: number; h: number },
  opts?: ChartDrawOpts,
): void {
  const leftDefs = panel.series.filter((s) => (s.axis ?? 'left') === 'left')
  const rightDefs = panel.series.filter((s) => s.axis === 'right')
  const hasRight = rightDefs.length > 0
  const layout = opts?.layout ?? {
    padL: 48,
    padR: hasRight ? 48 : 16,
    padT: 28,
    padB: 28,
  }
  const { plotL, plotT, plotW, plotH } = drawPanelFrame(
    ctx,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    panel,
    hasRight,
    layout,
  )

  if (data.t.length < 2) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)'
    ctx.font = '12px "Segoe UI", sans-serif'
    ctx.fillText('暂无采样', plotL + 12, plotT + 24)
    return
  }

  const endIdx = revealEndIndex(data, opts?.revealUntil)
  const t0 = data.t[0]!
  const t1 = data.t[data.t.length - 1]!
  const [lMin, lMax] = axisRange(collectAxisValues(data, panel.series, 'left'))
  const [rMin, rMax] = hasRight
    ? axisRange(collectAxisValues(data, panel.series, 'right'))
    : [0, 1]

  const xOf = (t: number) => plotL + ((t - t0) / Math.max(1e-9, t1 - t0)) * plotW
  const yLeft = (v: number) => plotT + (1 - (v - lMin) / Math.max(1e-9, lMax - lMin)) * plotH
  const yRight = (v: number) => plotT + (1 - (v - rMin) / Math.max(1e-9, rMax - rMin)) * plotH

  if (lMin < 0 && lMax > 0) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)'
    ctx.beginPath()
    ctx.moveTo(plotL, yLeft(0))
    ctx.lineTo(plotL + plotW, yLeft(0))
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(148, 163, 184, 0.55)'
  ctx.font = '10px "Segoe UI", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(lMax.toFixed(1), plotL - 6, plotT + 10)
  ctx.fillText(lMin.toFixed(1), plotL - 6, plotT + plotH)
  if (hasRight) {
    ctx.textAlign = 'left'
    ctx.fillText(rMax.toFixed(1), plotL + plotW + 6, plotT + 10)
    ctx.fillText(rMin.toFixed(1), plotL + plotW + 6, plotT + plotH)
  }
  ctx.textAlign = 'left'

  // legend（始终显示，便于辨认将要出现的曲线）
  let lx = plotL + 8
  const ly = plotT + 14
  ctx.font = '11px "Segoe UI", sans-serif'
  for (const def of panel.series) {
    ctx.fillStyle = def.color
    ctx.fillRect(lx, ly - 7, 10, 3)
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)'
    const label = def.unit ? `${def.label} (${def.unit})` : def.label
    ctx.fillText(label, lx + 14, ly)
    lx += ctx.measureText(label).width + 28
  }

  if (endIdx < 2) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)'
    ctx.font = '12px "Segoe UI", sans-serif'
    ctx.fillText('播放后随时间同步生成曲线', plotL + 12, plotT + 36)
    return
  }

  for (const def of leftDefs) {
    drawSeriesLine(ctx, data, def, xOf, yLeft, endIdx)
  }
  for (const def of rightDefs) {
    drawSeriesLine(ctx, data, def, xOf, yRight, endIdx)
  }

  const cursorT = opts?.cursorT ?? opts?.revealUntil
  if (cursorT != null && cursorT >= t0 && cursorT <= t1) {
    const cx = xOf(cursorT)
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.7)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(cx, plotT)
    ctx.lineTo(cx, plotT + plotH)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

/** 纵向堆叠多个图表面板到同一 canvas */
export function drawChartPanels(
  canvas: HTMLCanvasElement,
  data: MultiSeriesData,
  panels: DemoChartPanel[],
  opts?: ChartDrawOpts,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth || 640
  const H = canvas.clientHeight || 360
  canvas.width = Math.floor(W * dpr)
  canvas.height = Math.floor(H * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1220')
  bg.addColorStop(1, '#111827')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  if (!panels.length) {
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'
    ctx.font = '13px "Segoe UI", sans-serif'
    ctx.fillText('未配置图表面板', 24, 36)
    return
  }

  const anyRight = panels.some((p) => p.series.some((s) => s.axis === 'right'))
  const layout: PanelLayout = {
    padL: 48,
    padR: anyRight ? 48 : 16,
    padT: 28,
    padB: 28,
  }
  const gap = 6
  const panelH = (H - gap * (panels.length + 1)) / panels.length
  const drawOpts = { ...opts, layout }
  panels.forEach((panel, i) => {
    drawChartPanel(
      ctx,
      data,
      panel,
      {
        x: 0,
        y: gap + i * (panelH + gap),
        w: W,
        h: panelH,
      },
      drawOpts,
    )
  })
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

/** 沿独立变量（默认时间）完整采样各实时量 */
export function resampleOverTime(
  seek: (t: number) => void,
  observe: () => ObserveSnapshot | null,
  keys: string[],
  tMax: number,
  samples = 120,
): MultiSeriesData {
  const data = createEmptyMultiSeries()
  if (tMax <= 0 || keys.length === 0) return data
  const n = Math.max(2, samples)
  for (let i = 0; i <= n; i++) {
    const t = (tMax * i) / n
    seek(t)
    const snap = observe()
    if (!snap) continue
    pushMultiSample(data, snap, keys, n + 2)
  }
  return data
}
