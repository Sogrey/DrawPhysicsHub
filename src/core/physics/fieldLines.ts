/** Trace electric field lines for point-charge systems (teaching units). */

export interface FieldLineCharge {
  x: number
  y: number
  Q: number
}

export interface FieldLineBounds {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export function fieldFromPointCharges(
  charges: readonly FieldLineCharge[],
  x: number,
  y: number,
  k = 1,
  soft = 0.08,
): [number, number] {
  let Ex = 0
  let Ey = 0
  const soft2 = soft * soft
  for (const c of charges) {
    const dx = x - c.x
    const dy = y - c.y
    const r2 = dx * dx + dy * dy
    if (r2 < soft2) continue
    const r = Math.sqrt(r2)
    const mag = (k * c.Q) / r2
    Ex += (mag * dx) / r
    Ey += (mag * dy) / r
  }
  return [Ex, Ey]
}

export function traceFieldLine(opts: {
  field: (x: number, y: number) => [number, number]
  start: [number, number]
  /** +1 along E, −1 against E */
  direction?: 1 | -1
  step?: number
  maxSteps?: number
  bounds: FieldLineBounds
  /** stop when entering these radii (e.g. opposite charges) */
  sinks?: readonly { x: number; y: number; r: number }[]
  minMag?: number
}): number[][] {
  const dir = opts.direction ?? 1
  const step = opts.step ?? 0.06
  const maxSteps = opts.maxSteps ?? 280
  const minMag = opts.minMag ?? 1e-5
  const { bounds, sinks = [] } = opts
  const path: number[][] = [[opts.start[0], opts.start[1]]]
  let x = opts.start[0]
  let y = opts.start[1]

  for (let i = 0; i < maxSteps; i++) {
    const [Ex, Ey] = opts.field(x, y)
    const mag = Math.hypot(Ex, Ey)
    if (mag < minMag) break
    // RK2 mid-point
    const ux = (dir * Ex) / mag
    const uy = (dir * Ey) / mag
    const xm = x + ux * (step * 0.5)
    const ym = y + uy * (step * 0.5)
    const [Ex2, Ey2] = opts.field(xm, ym)
    const mag2 = Math.hypot(Ex2, Ey2)
    if (mag2 < minMag) break
    x += (dir * Ex2 * step) / mag2
    y += (dir * Ey2 * step) / mag2
    path.push([x, y])

    if (
      x < bounds.xMin ||
      x > bounds.xMax ||
      y < bounds.yMin ||
      y > bounds.yMax
    ) {
      break
    }
    let hitSink = false
    for (const s of sinks) {
      if (Math.hypot(x - s.x, y - s.y) <= s.r) {
        hitSink = true
        break
      }
    }
    if (hitSink) break
  }
  return path
}

export function traceChargeFieldLines(
  charges: readonly FieldLineCharge[],
  bounds: FieldLineBounds,
  opts?: {
    k?: number
    linesPerCharge?: number
    seedR?: number
    step?: number
    sinkR?: number
    angleOffset?: number
  },
): number[][][] {
  const k = opts?.k ?? 1
  const linesPerCharge = opts?.linesPerCharge ?? 12
  const seedR = opts?.seedR ?? 0.28
  const step = opts?.step ?? 0.055
  const sinkR = opts?.sinkR ?? 0.22
  const angleOffset = opts?.angleOffset ?? 0
  const eps = 0.05

  const field = (x: number, y: number) => fieldFromPointCharges(charges, x, y, k)
  const positives = charges.filter((c) => c.Q > eps)
  const negatives = charges.filter((c) => c.Q < -eps)

  const seeds: { start: [number, number]; direction: 1 | -1; sinks: { x: number; y: number; r: number }[] }[] =
    []

  const sources = positives.length ? positives : negatives
  const direction: 1 | -1 = positives.length ? 1 : -1
  const sinks =
    direction === 1
      ? negatives.map((c) => ({ x: c.x, y: c.y, r: sinkR }))
      : positives.map((c) => ({ x: c.x, y: c.y, r: sinkR }))

  for (const c of sources) {
    for (let i = 0; i < linesPerCharge; i++) {
      const th = angleOffset + (2 * Math.PI * i) / linesPerCharge
      seeds.push({
        start: [c.x + seedR * Math.cos(th), c.y + seedR * Math.sin(th)],
        direction,
        sinks,
      })
    }
  }

  // same-sign: also seed a few mid-plane lines outward for coverage
  if (positives.length >= 2 && negatives.length === 0) {
    const midX = (positives[0]!.x + positives[1]!.x) / 2
    for (const sy of [-0.8, -0.4, 0.4, 0.8]) {
      seeds.push({
        start: [midX, sy],
        direction: 1,
        sinks: [],
      })
    }
  }

  const paths: number[][][] = []
  for (const s of seeds) {
    const path = traceFieldLine({
      field,
      start: s.start,
      direction: s.direction,
      step,
      maxSteps: 320,
      bounds,
      sinks: s.sinks,
    })
    if (path.length >= 4) paths.push(path)
  }
  return paths
}
