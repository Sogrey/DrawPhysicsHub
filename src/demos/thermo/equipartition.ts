import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createEquipartitionAdapter } from './equipartitionAdapter'

/** 摩尔热容 Cv = (f/2) R；Cp = Cv+R；γ=Cp/Cv */
export function heatCapacity(f: number, R = 2): { Cv: number; Cp: number; gamma: number } {
  const Cv = (f / 2) * R
  const Cp = Cv + R
  return { Cv, Cp, gamma: Cp / Math.max(1e-9, Cv) }
}

export function createEquipartitionModel(): PhysicsModel {
  let f = 5
  let T = 1
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      f = Math.round(Number(p.f ?? 5))
      T = Number(p.T ?? 1)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const ff = Math.min(7, Math.max(3, f))
      const hc = heatCapacity(ff)
      const blend = t / period
      // 播放：自由度逐个点亮，内能 U 随点亮份数增长
      const lit = Math.min(ff, Math.max(0, Math.floor(blend * (ff + 0.999))))
      const U = (lit / 2) * T // R=1 示意，按已点亮自由度
      const Ufull = (ff / 2) * T
      const bars: number[][] = []
      for (let i = 3; i <= 7; i++) bars.push([i, heatCapacity(i).Cv])
      return {
        time: t,
        values: {
          f: ff,
          T,
          U,
          Ufull,
          lit,
          blend,
          ...hc,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: bars },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.f !== undefined) f = Math.round(Number(p.f))
      if (p.T !== undefined) T = Number(p.T)
    },
  }
}

export const equipartitionMeta: DemoMeta = {
  id: 'thermo-equipartition',
  subject: '热学',
  category: '分子动理论',
  tags: ['均分', '自由度', '热容'],
  model: 'equipartition',
  adapter: 'equipartition',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'f', label: '自由度 f', kind: 'number', default: 5, min: 3, max: 7, step: 1, unit: '' },
    { key: 'T', label: '温度 T', kind: 'number', default: 1, min: 0.5, max: 2, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '均分' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'Cv',
      chartKey: 'Cv',
      charts: [
        {
          id: 'c',
          title: '热容',
          xLabel: 't',
          leftLabel: 'C',
          series: [
            { key: 'Cv', label: 'Cv', color: '#38bdf8', unit: '' },
            { key: 'Cp', label: 'Cp', color: '#fbbf24', unit: '' },
            { key: 'U', label: 'U(已点亮)', color: '#f472b6', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'f', label: 'f', unit: '', tone: 'slate' },
    { key: 'lit', label: '已点亮', unit: '', tone: 'purple' },
    { key: 'Cv', label: 'Cv', unit: '', tone: 'blue' },
    { key: 'gamma', label: 'γ', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '能量均分与热容',
    summary: '每个自由度均分 ½kT；Cv=(f/2)R，γ=Cp/Cv。双原子常温 f≈5。',
    concept: ['能量均分', '自由度', '热容比'],
    objectives: ['切换 f=3/5/7', '播放看自由度点亮', '读 Cv、γ'],
    formulas: ['C_V=(f/2)R', '\\gamma=C_P/C_V'],
    insight: '柱高∝Cv(f)；播放逐个点亮自由度，U 随之增长。',
    legend: [
      { color: '#38bdf8', label: 'Cv' },
      { color: '#f472b6', label: '已点亮自由度' },
    ],
    steps: [
      {
        id: 'f',
        title: '自由度',
        body: '取 f=5（双原子），播放观察点亮。',
        formulas: ['f'],
        bindings: [
          { labelTex: 'C_V', valueKey: 'Cv', unit: '' },
          { labelTex: 'U', valueKey: 'U', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'mono',
        prompt: '取 f=3（单原子）。',
        hint: '调自由度。',
        check: { kind: 'paramNear', key: 'f', target: 3, tol: 0.5 },
      },
    ],
  },
}

export function registerEquipartitionDemo() {
  registerDemoBundle({
    meta: equipartitionMeta,
    model: createEquipartitionModel,
    adapter: createEquipartitionAdapter,
  })
}
