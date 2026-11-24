import { describe, expect, it } from 'vitest'
import { createIdealGasModel, idealGasMeta, idealPressure } from './idealGas'
import { resolveTMax } from '@/core/physics/types'

describe('Ideal gas law', () => {
  it('P = nRT/V', () => {
    expect(idealPressure(1, 2, 2)).toBeCloseTo(1, 8)
  })

  it('keeps residual ~ 0', () => {
    const m = createIdealGasModel()
    m.init({ n: 1.2, T: 2.5, V: 1.5 })
    expect(Number(m.observe().values.residual)).toBeLessThan(1e-9)
    const live: Record<string, number> = {}
    for (const [k, v] of Object.entries(m.observe().values)) {
      if (typeof v === 'number') live[k] = v
    }
    expect(resolveTMax(live, idealGasMeta)).toBeCloseTo(6, 5)
  })
})
