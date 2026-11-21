import { describe, expect, it } from 'vitest'
import { fieldFromPointCharges, traceChargeFieldLines, traceFieldLine } from './fieldLines'

describe('field lines', () => {
  it('points away from +Q and toward −Q on the axis', () => {
    const charges = [
      { x: -1, y: 0, Q: -1 },
      { x: 1, y: 0, Q: 1 },
    ]
    // 轴上中点：场由 + 指向 −（−x）；轴外右侧：背离 +Q（+x）
    const [ExMid] = fieldFromPointCharges(charges, 0, 0)
    expect(ExMid).toBeLessThan(0)
    const [ExRight] = fieldFromPointCharges(charges, 2.5, 0)
    expect(ExRight).toBeGreaterThan(0)
  })

  it('connects +Q to −Q for a dipole seed', () => {
    const charges = [
      { x: -1.2, y: 0, Q: -2 },
      { x: 1.2, y: 0, Q: 2 },
    ]
    // 从 +Q 朝向中点一侧播种，场线应落入 −Q
    const path = traceFieldLine({
      field: (x, y) => fieldFromPointCharges(charges, x, y),
      start: [1.2 - 0.28, 0.35],
      direction: 1,
      step: 0.05,
      maxSteps: 400,
      bounds: { xMin: -5, xMax: 5, yMin: -4, yMax: 4 },
      sinks: [{ x: -1.2, y: 0, r: 0.25 }],
    })
    const last = path[path.length - 1]!
    expect(Math.hypot(last[0]! + 1.2, last[1]!)).toBeLessThan(0.35)
  })

  it('emits multiple lines from positive charges', () => {
    const paths = traceChargeFieldLines(
      [
        { x: -1, y: 0, Q: -1.5 },
        { x: 1, y: 0, Q: 2 },
      ],
      { xMin: -4.5, xMax: 4.5, yMin: -3.4, yMax: 3.4 },
      { linesPerCharge: 10 },
    )
    expect(paths.length).toBeGreaterThanOrEqual(8)
  })
})
