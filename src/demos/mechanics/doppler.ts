import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createDopplerAdapter } from './dopplerAdapter'

/** 源运动多普勒（静止观察者）：f' = f / (1 − vs/c cosθ) 教学一维 f'=f c/(c±vs) */
export function dopplerFreq(f0: number, vs: number, c: number, approach: boolean): number {
  const den = approach ? c - vs : c + vs
  return (f0 * c) / Math.max(0.05, den)
}

export function createDopplerModel(): PhysicsModel {
  let f0 = 2
  let vs = 0.6
  let c = 2
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      f0 = Number(params.f0 ?? 2)
      vs = Number(params.vs ?? 0.6)
      c = Number(params.c ?? 2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const xS = -3 + vs * t
      const rings: number[][] = []
      // wavefronts emitted at past times
      for (let i = 0; i < 8; i++) {
        const te = t - i * (1 / f0)
        if (te < 0) continue
        const xe = -3 + vs * te
        const r = c * (t - te)
        rings.push([xe, r])
      }
      const fApp = dopplerFreq(f0, vs, c, true)
      const fRec = dopplerFreq(f0, vs, c, false)
      return {
        time: t,
        values: {
          f0,
          vs,
          c,
          xS,
          fApp,
          fRec,
          Mach: vs / c,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: rings },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.f0 !== undefined) f0 = Number(params.f0)
      if (params.vs !== undefined) vs = Number(params.vs)
      if (params.c !== undefined) c = Number(params.c)
    },
  }
}

export const dopplerMeta: DemoMeta = {
  id: 'mech-doppler',
  subject: '力学',
  category: '波动',
  tags: ['多普勒', '波前'],
  model: 'doppler',
  adapter: 'doppler',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'vs', label: '源速 vs', kind: 'number', default: 0.6, min: 0, max: 1.5, step: 0.1, unit: '' },
    { key: 'c', label: '波速 c', kind: 'number', default: 2, min: 1, max: 3, step: 0.2, unit: '' },
    { key: 'f0', label: '固有频率 f₀', kind: 'number', default: 2, min: 1, max: 3, step: 0.2, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '波前' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'f',
      chartKey: 'fApp',
      charts: [
        {
          id: 'f',
          title: '频率',
          xLabel: 't',
          leftLabel: 'f',
          series: [
            { key: 'fApp', label: '迎面', color: '#f472b6', unit: '' },
            { key: 'fRec', label: '远离', color: '#38bdf8', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'fApp', label: 'f_迎', unit: '', tone: 'pink' },
    { key: 'fRec', label: 'f_远', unit: '', tone: 'blue' },
    { key: 'Mach', label: 'vs/c', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '多普勒效应示意',
    summary: '运动声源：前方波前变密（频率↑），后方变疏。f′=f c/(c∓vs)。圆波前圆心偏移。',
    concept: ['源向观察者 → 频率升高', '波前间距变化', 'vs→c 时前方堆积'],
    objectives: ['观察波前疏密', '读出迎面/远离频率', '提高 vs 看不对称加剧'],
    formulas: ["f'=f\\frac{c}{c\\mp v_s}"],
    insight: '金=声源；青圈=波前。前方更密。',
    legend: [
      { color: '#fbbf24', label: '源' },
      { color: '#38bdf8', label: '波前' },
    ],
    steps: [
      {
        id: 'fast',
        title: '加速',
        body: '增大 vs，看 f_迎 上升。',
        formulas: ["f'_{\\mathrm{app}}"],
        bindings: [
          { labelTex: "f'", valueKey: 'fApp', unit: '' },
          { labelTex: 'v_s', valueKey: 'vs', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'hi',
        prompt: '使 vs/c≥0.4。',
        hint: '提高源速或降低波速。',
        check: { kind: 'valueNear', key: 'Mach', target: 0.5, tol: 0.25 },
      },
    ],
  },
}

export function registerDopplerDemo(): void {
  registerDemoBundle({
    meta: dopplerMeta,
    model: createDopplerModel,
    adapter: createDopplerAdapter,
  })
}
