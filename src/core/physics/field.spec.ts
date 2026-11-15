import { describe, expect, it } from 'vitest'
import { makeGrid2D, sampleScalar2D, sampleVector2D } from './field'

describe('field sampling', () => {
  it('samples scalar field on grid', () => {
    const grid = makeGrid2D({ xMin: 0, xMax: 1, yMin: 0, yMax: 1, nx: 3, ny: 3 })
    const { values } = sampleScalar2D(grid, (x, y) => x + y)
    expect(values.length).toBe(9)
    expect(values[0]).toBeCloseTo(0)
    expect(values[8]).toBeCloseTo(2)
  })

  it('samples vector field interleaved', () => {
    const grid = makeGrid2D({ xMin: 0, xMax: 1, yMin: 0, yMax: 0, nx: 2, ny: 2 })
    const { vectors } = sampleVector2D(grid, (x, y) => [x, y])
    expect(vectors.length).toBe(8)
    expect(vectors[0]).toBeCloseTo(0)
    expect(vectors[1]).toBeCloseTo(0)
  })
})
