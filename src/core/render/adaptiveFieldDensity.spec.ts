import { describe, expect, it } from 'vitest'
import { adaptiveFieldDensity } from './adaptiveFieldDensity'

const world = { xMin: -4, xMax: 4, yMin: -3, yMax: 3 }

describe('adaptiveFieldDensity', () => {
  it('uses fewer lines on small viewports', () => {
    const small = adaptiveFieldDensity({ world, pixelW: 320, pixelH: 240, nSources: 2 })
    const large = adaptiveFieldDensity({ world, pixelW: 1200, pixelH: 800, nSources: 2 })
    expect(small.linesPerCharge).toBeLessThanOrEqual(large.linesPerCharge)
    expect(small.arrowEvery).toBeGreaterThanOrEqual(large.arrowEvery * 0.85)
  })

  it('reduces lines when more sources', () => {
    const one = adaptiveFieldDensity({ world, pixelW: 800, pixelH: 600, nSources: 1 })
    const two = adaptiveFieldDensity({ world, pixelW: 800, pixelH: 600, nSources: 2 })
    expect(two.linesPerCharge).toBeLessThanOrEqual(one.linesPerCharge)
  })

  it('provides wire ring radii inside world', () => {
    const d = adaptiveFieldDensity({ world, pixelW: 700, pixelH: 500 })
    expect(d.wireRadii.length).toBeGreaterThanOrEqual(4)
    expect(d.wireRadii.every((r) => r > 0 && r < 4)).toBe(true)
  })
})
