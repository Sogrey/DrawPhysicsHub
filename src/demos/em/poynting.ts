import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createPoyntingAdapter } from './poyntingAdapter'

/** |S| = |E||B|/μ₀ 教学单位 μ₀=1 → S=E B（平面波 E⊥B） */
export function poyntingMag(E: number, B: number): number {
  return Math.abs(E * B)
}

export function createPoyntingModel(): PhysicsModel {
  let E0 = 1.2
  let B0 = 1
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      E0 = Number(p.E0 ?? 1.2)
      B0 = Number(p.B0 ?? 1)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const phase = (2 * Math.PI * t) / period
      const E = E0 * Math.cos(phase)
      const B = B0 * Math.cos(phase)
      const S = poyntingMag(E, B) * Math.sign(Math.cos(phase) || 1)
      const Sabs = poyntingMag(E, B)
      // 波前位置
      const x = -2 + 4 * (t / period)
      return {
        time: t,
        values: {
          E0,
          B0,
          E,
          B,
          S,
          Sabs,
          x,
          phase,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.E0 !== undefined) E0 = Number(p.E0)
      if (p.B0 !== undefined) B0 = Number(p.B0)
    },
  }
}

export const poyntingMeta: DemoMeta = {
  id: 'em-poynting',
  subject: '电磁学',
  category: '电磁波',
  tags: ['坡印廷', '能流'],
  model: 'poynting',
  adapter: 'poynting',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'E0', label: 'E₀', kind: 'number', default: 1.2, min: 0.4, max: 2, step: 0.1, unit: '' },
    { key: 'B0', label: 'B₀', kind: 'number', default: 1, min: 0.4, max: 2, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '能流' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'S',
      chartKey: 'Sabs',
      charts: [
        {
          id: 's',
          title: '坡印廷强度',
          xLabel: 't',
          leftLabel: '|S|',
          series: [
            { key: 'Sabs', label: '|S|', color: '#fbbf24', unit: '' },
            { key: 'E', label: 'E', color: '#38bdf8', unit: '' },
            { key: 'B', label: 'B', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'E', label: 'E', unit: '', tone: 'blue' },
    { key: 'B', label: 'B', unit: '', tone: 'purple' },
    { key: 'Sabs', label: '|S|', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '坡印廷矢量能流示意',
    summary: '平面波中 S=E×B（教学 μ₀=1），能流沿传播方向；|S|∝|E||B|。',
    concept: ['坡印廷矢量', '能流密度', 'E⊥B⊥k'],
    objectives: ['播放看 E、B 同相', '读 |S|', '改振幅看能流'],
    formulas: ['\\mathbf{S}=\\mathbf{E}\\times\\mathbf{B}/\\mu_0', '|S|\\propto|E||B|'],
    insight: '青=E，紫=B，金箭头=S 方向。',
    legend: [
      { color: '#38bdf8', label: 'E' },
      { color: '#a78bfa', label: 'B' },
      { color: '#fbbf24', label: 'S' },
    ],
    steps: [
      {
        id: 'flow',
        title: '能流',
        body: '播放观察 |S| 随相位变化。',
        formulas: ['|S|'],
        bindings: [
          { labelTex: '|S|', valueKey: 'Sabs', unit: '' },
          { labelTex: 'E', valueKey: 'E', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'bigE',
        prompt: '取 E₀≥1.6 增大能流峰值。',
        hint: '调 E₀。',
        check: { kind: 'paramNear', key: 'E0', target: 1.8, tol: 0.3 },
      },
    ],
  },
}

export function registerPoyntingDemo() {
  registerDemoBundle({ meta: poyntingMeta, model: createPoyntingModel, adapter: createPoyntingAdapter })
}
