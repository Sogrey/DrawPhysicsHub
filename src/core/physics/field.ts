/** Regular grid field sampling (M1-09) */

export interface Grid2D {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  nx: number
  ny: number
}

export interface ScalarSample2D {
  grid: Grid2D
  /** row-major, length nx * ny */
  values: Float32Array
}

export interface VectorSample2D {
  grid: Grid2D
  /** interleaved [ux, uy, ...], length nx * ny * 2 */
  vectors: Float32Array
}

export function makeGrid2D(partial: Grid2D): Grid2D {
  if (partial.nx < 2 || partial.ny < 2) throw new Error('网格至少 2×2')
  return { ...partial }
}

export function sampleScalar2D(
  grid: Grid2D,
  f: (x: number, y: number) => number,
): ScalarSample2D {
  const values = new Float32Array(grid.nx * grid.ny)
  const dx = (grid.xMax - grid.xMin) / (grid.nx - 1)
  const dy = (grid.yMax - grid.yMin) / (grid.ny - 1)
  let i = 0
  for (let iy = 0; iy < grid.ny; iy++) {
    const y = grid.yMin + iy * dy
    for (let ix = 0; ix < grid.nx; ix++) {
      const x = grid.xMin + ix * dx
      values[i++] = f(x, y)
    }
  }
  return { grid, values }
}

export function sampleVector2D(
  grid: Grid2D,
  f: (x: number, y: number) => [number, number],
): VectorSample2D {
  const vectors = new Float32Array(grid.nx * grid.ny * 2)
  const dx = (grid.xMax - grid.xMin) / (grid.nx - 1)
  const dy = (grid.yMax - grid.yMin) / (grid.ny - 1)
  let i = 0
  for (let iy = 0; iy < grid.ny; iy++) {
    const y = grid.yMin + iy * dy
    for (let ix = 0; ix < grid.nx; ix++) {
      const x = grid.xMin + ix * dx
      const [ux, uy] = f(x, y)
      vectors[i++] = ux
      vectors[i++] = uy
    }
  }
  return { grid, vectors }
}
