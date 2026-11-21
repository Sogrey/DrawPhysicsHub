import type { Charge } from './potential'
import { potentialAt } from './potential'

export type WorldRect = { xMin: number; xMax: number; yMin: number; yMax: number }

/**
 * 简易 marching squares：返回等势线折线段 [[x,y], ...][]
 */
export function traceEquipotentials(
  charges: readonly Charge[],
  world: WorldRect,
  levels: readonly number[],
  nx = 56,
  ny = 42,
): { level: number; segs: number[][][] }[] {
  const dx = (world.xMax - world.xMin) / Math.max(1, nx - 1)
  const dy = (world.yMax - world.yMin) / Math.max(1, ny - 1)
  const grid: number[] = new Array(nx * ny)
  for (let j = 0; j < ny; j++) {
    const y = world.yMin + j * dy
    for (let i = 0; i < nx; i++) {
      const x = world.xMin + i * dx
      // 电荷近旁置 NaN，避免奇点污染等高线
      let near = false
      for (const c of charges) {
        if (Math.hypot(x - c.x, y - c.y) < 0.28) {
          near = true
          break
        }
      }
      grid[j * nx + i] = near ? Number.NaN : potentialAt(charges, x, y)
    }
  }

  const out: { level: number; segs: number[][][] }[] = []
  for (const level of levels) {
    const segs: number[][][] = []
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const v00 = grid[j * nx + i]!
        const v10 = grid[j * nx + i + 1]!
        const v01 = grid[(j + 1) * nx + i]!
        const v11 = grid[(j + 1) * nx + i + 1]!
        if ([v00, v10, v01, v11].some((v) => Number.isNaN(v))) continue
        const x0 = world.xMin + i * dx
        const y0 = world.yMin + j * dy
        const corners: [number, number, number][] = [
          [x0, y0, v00],
          [x0 + dx, y0, v10],
          [x0 + dx, y0 + dy, v11],
          [x0, y0 + dy, v01],
        ]
        let code = 0
        if (v00 >= level) code |= 1
        if (v10 >= level) code |= 2
        if (v11 >= level) code |= 4
        if (v01 >= level) code |= 8
        if (code === 0 || code === 15) continue
        const edge = (a: number, b: number): [number, number] => {
          const [xa, ya, va] = corners[a]!
          const [xb, yb, vb] = corners[b]!
          const t = (level - va) / (vb - va || 1e-9)
          return [xa + (xb - xa) * t, ya + (yb - ya) * t]
        }
        // edges: 0 bottom, 1 right, 2 top, 3 left
        const pairs: [number, number][] =
          code === 1 || code === 14
            ? [[0, 3]]
            : code === 2 || code === 13
              ? [[0, 1]]
              : code === 4 || code === 11
                ? [[1, 2]]
                : code === 8 || code === 7
                  ? [[2, 3]]
                  : code === 3 || code === 12
                    ? [[1, 3]]
                    : code === 6 || code === 9
                      ? [[0, 2]]
                      : code === 5
                        ? [
                            [0, 3],
                            [1, 2],
                          ]
                        : code === 10
                          ? [
                              [0, 1],
                              [2, 3],
                            ]
                          : []
        for (const [ea, eb] of pairs) {
          const ends = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
          ] as const
          const [a0, a1] = ends[ea]!
          const [b0, b1] = ends[eb]!
          segs.push([edge(a0, a1), edge(b0, b1)])
        }
      }
    }
    out.push({ level, segs })
  }
  return out
}

/** 根据电荷量选取若干有代表性的等势值 */
export function pickPotentialLevels(charges: readonly Charge[], world: WorldRect): number[] {
  const samples: number[] = []
  for (let i = 0; i < 24; i++) {
    const x = world.xMin + ((world.xMax - world.xMin) * (i + 0.5)) / 24
    for (let j = 0; j < 18; j++) {
      const y = world.yMin + ((world.yMax - world.yMin) * (j + 0.5)) / 18
      let near = false
      for (const c of charges) {
        if (Math.hypot(x - c.x, y - c.y) < 0.35) {
          near = true
          break
        }
      }
      if (!near) samples.push(potentialAt(charges, x, y))
    }
  }
  samples.sort((a, b) => a - b)
  if (samples.length < 8) return [-2, -1, -0.5, 0.5, 1, 2]
  const qs = [0.12, 0.25, 0.4, 0.55, 0.7, 0.85].map((q) => samples[Math.floor(q * (samples.length - 1))]!)
  // 去重并丢掉接近 0 的挤在一起的值
  const levels: number[] = []
  for (const v of qs) {
    if (Math.abs(v) < 0.08) continue
    if (levels.every((u) => Math.abs(u - v) > 0.18)) levels.push(v)
  }
  if (levels.length < 4) {
    const span = Math.max(1, Math.abs(samples[samples.length - 1]!) + Math.abs(samples[0]!))
    return [-0.6, -0.3, 0.3, 0.6, 1.0].map((f) => f * span * 0.5)
  }
  return levels
}
