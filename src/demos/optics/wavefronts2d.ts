/** Shared wavefront / intensity-curve / spatial-field drawing for optics demos */

export type ScreenMapper = {
  sx: (x: number) => number
  sy: (y: number) => number
}

export type PointSource = { x: number; y: number }

/**
 * Paint coherent superposition intensity |Σ e^{i(kr−φ)} / √r |² in a world rectangle.
 * Shows how fringes form in space (formation process), not only on the screen.
 */
export function paintCoherentIntensityField(
  ctx: CanvasRenderingContext2D,
  map: ScreenMapper,
  sources: readonly PointSource[],
  opts: {
    lambda: number
    /** wave phase ωt in radians */
    phaseRad?: number
    x0: number
    x1: number
    y0: number
    y1: number
    nx?: number
    ny?: number
    /** 'blue' | 'green' tint */
    tint?: 'blue' | 'green'
    alpha?: number
  },
): void {
  if (sources.length === 0 || opts.x1 <= opts.x0) return
  const nx = opts.nx ?? 72
  const ny = opts.ny ?? 56
  const k = (2 * Math.PI) / Math.max(opts.lambda, 1e-6)
  const phi0 = opts.phaseRad ?? 0
  const tint = opts.tint ?? 'blue'
  const alphaMul = opts.alpha ?? 0.72

  const px0 = map.sx(opts.x0)
  const px1 = map.sx(opts.x1)
  const py0 = map.sy(opts.y1) // screen y grows down
  const py1 = map.sy(opts.y0)
  const w = Math.max(1, Math.floor(px1 - px0))
  const h = Math.max(1, Math.floor(py1 - py0))

  // sample in world, draw as image scaled to screen rect
  const img = ctx.createImageData(nx, ny)
  let maxI = 1e-9
  const Intens = new Float32Array(nx * ny)
  for (let j = 0; j < ny; j++) {
    const y = opts.y1 - ((opts.y1 - opts.y0) * j) / Math.max(1, ny - 1)
    for (let i = 0; i < nx; i++) {
      const x = opts.x0 + ((opts.x1 - opts.x0) * i) / Math.max(1, nx - 1)
      let re = 0
      let im = 0
      for (const s of sources) {
        const dx = x - s.x
        const dy = y - s.y
        const r = Math.hypot(dx, dy)
        if (r < 0.08) continue
        const amp = 1 / Math.sqrt(r)
        const ph = k * r - phi0
        re += amp * Math.cos(ph)
        im += amp * Math.sin(ph)
      }
      const I = re * re + im * im
      Intens[j * nx + i] = I
      if (I > maxI) maxI = I
    }
  }
  for (let p = 0; p < Intens.length; p++) {
    const In = Intens[p]! / maxI
    const a = Math.floor(255 * alphaMul * Math.min(1, In * 1.15))
    const idx = p * 4
    if (tint === 'green') {
      img.data[idx] = Math.floor(30 + 40 * In)
      img.data[idx + 1] = Math.floor(80 + 160 * In)
      img.data[idx + 2] = Math.floor(50 + 60 * In)
    } else {
      img.data[idx] = Math.floor(30 + 50 * In)
      img.data[idx + 1] = Math.floor(60 + 120 * In)
      img.data[idx + 2] = Math.floor(100 + 155 * In)
    }
    img.data[idx + 3] = a
  }

  // draw via temp canvas for scaling
  const tmp = document.createElement('canvas')
  tmp.width = nx
  tmp.height = ny
  const tctx = tmp.getContext('2d')
  if (!tctx) return
  tctx.putImageData(img, 0, 0)
  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(tmp, px0, py0, w, h)
  ctx.restore()
}

/** Annotate path difference at probe: rays + δ / φ + 相长|相消 */
export function drawPathDifferenceCallout(
  ctx: CanvasRenderingContext2D,
  map: ScreenMapper,
  opts: {
    sources: readonly PointSource[]
    probe: { x: number; y: number }
    lambda: number
    delta: number
    phiDeg: number
    I: number
  },
): void {
  const { sources, probe, delta, phiDeg, I } = opts
  ctx.save()
  ctx.lineWidth = 1.6
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i]!
    ctx.strokeStyle = i === 0 ? 'rgba(251, 191, 36, 0.7)' : 'rgba(244, 114, 182, 0.7)'
    ctx.beginPath()
    ctx.moveTo(map.sx(s.x), map.sy(s.y))
    ctx.lineTo(map.sx(probe.x), map.sy(probe.y))
    ctx.stroke()
  }

  const constructive = I > 0.55
  const destructive = I < 0.2
  const label = constructive ? '相长干涉' : destructive ? '相消干涉' : '部分干涉'
  const color = constructive
    ? 'rgba(74, 222, 128, 0.95)'
    : destructive
      ? 'rgba(248, 113, 113, 0.95)'
      : 'rgba(251, 191, 36, 0.95)'

  const lx = map.sx(probe.x) - 120
  const ly = map.sy(probe.y) - 28
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)'
  ctx.fillRect(lx, ly, 118, 46)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.2
  ctx.strokeRect(lx, ly, 118, 46)
  ctx.fillStyle = color
  ctx.font = 'bold 12px "Segoe UI", sans-serif'
  ctx.fillText(label, lx + 8, ly + 17)
  ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
  ctx.font = '11px "Segoe UI", sans-serif'
  ctx.fillText(`δ=${delta.toFixed(3)}  φ=${phiDeg.toFixed(0)}°`, lx + 8, ly + 35)
  ctx.restore()
}

/** Circular wavefront arcs from a point source (rightward half by default). */
export function drawCircularWavefronts(
  ctx: CanvasRenderingContext2D,
  map: ScreenMapper,
  cx: number,
  cy: number,
  opts: {
    lambda: number
    phase?: number
    rMin?: number
    rMax: number
    strokeStyle?: string
    lineWidth?: number
    /** radians of arc; default ≈ right hemisphere */
    startAngle?: number
    endAngle?: number
  },
): void {
  const phase = opts.phase ?? 0
  const rMin = opts.rMin ?? opts.lambda * 0.4
  const stroke = opts.strokeStyle ?? 'rgba(56, 189, 248, 0.55)'
  const lw = opts.lineWidth ?? 1.25
  const a0 = opts.startAngle ?? -Math.PI * 0.55
  const a1 = opts.endAngle ?? Math.PI * 0.55
  ctx.save()
  ctx.strokeStyle = stroke
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  const n = Math.max(3, Math.floor(opts.rMax / Math.max(opts.lambda, 0.05)) + 2)
  for (let i = 0; i < n; i++) {
    let r = rMin + i * opts.lambda + ((phase % opts.lambda) + opts.lambda) % opts.lambda
    if (r > opts.rMax) continue
    if (r < rMin * 0.5) continue
    ctx.globalAlpha = 0.35 + 0.45 * (1 - r / opts.rMax)
    ctx.beginPath()
    // sample arc in world, map to screen
    const steps = 36
    for (let k = 0; k <= steps; k++) {
      const th = a0 + ((a1 - a0) * k) / steps
      const x = cx + r * Math.cos(th)
      const y = cy + r * Math.sin(th)
      const px = map.sx(x)
      const py = map.sy(y)
      if (k === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }
  ctx.restore()
}

/** Plane-wave arrows incident from the left. */
export function drawPlaneWaveArrows(
  ctx: CanvasRenderingContext2D,
  map: ScreenMapper,
  opts: {
    x0: number
    x1: number
    yMin: number
    yMax: number
    rows?: number
    strokeStyle?: string
  },
): void {
  const rows = opts.rows ?? 5
  const stroke = opts.strokeStyle ?? 'rgba(74, 222, 128, 0.85)'
  ctx.save()
  ctx.strokeStyle = stroke
  ctx.fillStyle = stroke
  ctx.lineWidth = 1.6
  for (let i = 0; i < rows; i++) {
    const y = opts.yMin + ((opts.yMax - opts.yMin) * (i + 0.5)) / rows
    const x0 = map.sx(opts.x0)
    const x1 = map.sx(opts.x1)
    const py = map.sy(y)
    ctx.beginPath()
    ctx.moveTo(x0, py)
    ctx.lineTo(x1, py)
    ctx.stroke()
    // arrow head
    ctx.beginPath()
    ctx.moveTo(x1, py)
    ctx.lineTo(x1 - 8, py - 4)
    ctx.lineTo(x1 - 8, py + 4)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

/**
 * Draw I(y) as a curve to the right of the screen (textbook side panel).
 * screenI: row-major from yMin→yMax, values in [0,1].
 */
export function drawIntensityCurvePanel(
  ctx: CanvasRenderingContext2D,
  map: ScreenMapper,
  opts: {
    x0: number
    width: number
    yMin: number
    yMax: number
    values: Float32Array
    strokeStyle?: string
    fillStyle?: string
    label?: string
    probeY?: number
    probeI?: number
  },
): void {
  const n = opts.values.length
  if (n < 2) return
  const xBase = opts.x0
  const xMax = opts.x0 + opts.width
  const stroke = opts.strokeStyle ?? 'rgba(74, 222, 128, 0.95)'
  const fill = opts.fillStyle ?? 'rgba(74, 222, 128, 0.12)'

  ctx.save()
  // panel frame
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
  ctx.lineWidth = 1
  ctx.strokeRect(
    map.sx(xBase),
    map.sy(opts.yMax),
    map.sx(xMax) - map.sx(xBase),
    map.sy(opts.yMin) - map.sy(opts.yMax),
  )

  // baseline (I=0) at xBase
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
  ctx.moveTo(map.sx(xBase), map.sy(opts.yMin))
  ctx.lineTo(map.sx(xBase), map.sy(opts.yMax))
  ctx.stroke()

  // filled area + curve: x = xBase + width * I
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const y = opts.yMin + ((opts.yMax - opts.yMin) * i) / (n - 1)
    const I = opts.values[i]!
    const x = xBase + opts.width * I
    const px = map.sx(x)
    const py = map.sy(y)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2
  ctx.stroke()

  // soft fill back to baseline
  ctx.lineTo(map.sx(xBase), map.sy(opts.yMax))
  ctx.lineTo(map.sx(xBase), map.sy(opts.yMin))
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()

  if (opts.label) {
    ctx.fillStyle = stroke
    ctx.font = '12px "Segoe UI", sans-serif'
    ctx.fillText(opts.label, map.sx(xBase) + 4, map.sy(opts.yMax) - 6)
  }

  if (opts.probeY !== undefined && opts.probeI !== undefined) {
    const px = map.sx(xBase + opts.width * opts.probeI)
    const py = map.sy(opts.probeY)
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(px, py, 4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
