import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createBernoulliAdapter } from './bernoulliAdapter'

/** 连续方程：A1 v1 = A2 v2 */
export function continuitySpeed(A1: number, v1: number, A2: number): number {
  return (A1 * v1) / Math.max(1e-9, A2)
}

/** 伯努利：P + ½ρv² + ρgh = const（水平管 h 同）→ ΔP = ½ρ(v1²−v2²) */
export function bernoulliDeltaP(rho: number, v1: number, v2: number): number {
  return 0.5 * rho * (v1 * v1 - v2 * v2)
}

export function createBernoulliModel(): PhysicsModel {
  let A1 = 2
  let A2 = 0.8
  let v1 = 1.2
  let t = 0
  const period = 8
  const rho = 1

  return {
    init(p: ParamValues) {
      A1 = Number(p.A1 ?? 2)
      A2 = Number(p.A2 ?? 0.8)
      v1 = Number(p.v1 ?? 1.2)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const v2 = continuitySpeed(A1, v1, A2)
      const dP = bernoulliDeltaP(rho, v1, v2)
      const u = t / period
      // 示踪粒子沿管轴线
      const x = -2.2 + 4.4 * u
      const inNarrow = x > 0
      const vNow = inNarrow ? v2 : v1
      return {
        time: t,
        values: {
          A1,
          A2,
          v1,
          v2,
          dP,
          rho,
          x,
          vNow,
          ratio: v2 / Math.max(1e-9, v1),
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
      if (p.A1 !== undefined) A1 = Number(p.A1)
      if (p.A2 !== undefined) A2 = Number(p.A2)
      if (p.v1 !== undefined) v1 = Number(p.v1)
    },
  }
}

export const bernoulliMeta: DemoMeta = {
  id: 'mech-bernoulli',
  subject: '力学',
  category: '流体与连续介质',
  tags: ['流体', '伯努利'],
  model: 'bernoulli',
  adapter: 'bernoulli',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'A1', label: '宽段面积 A₁', kind: 'number', default: 2, min: 1, max: 3, step: 0.1, unit: '' },
    { key: 'A2', label: '窄段面积 A₂', kind: 'number', default: 0.8, min: 0.4, max: 1.5, step: 0.05, unit: '' },
    { key: 'v1', label: '宽段流速 v₁', kind: 'number', default: 1.2, min: 0.5, max: 2.5, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '流管' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'ΔP',
      chartKey: 'dP',
      charts: [
        {
          id: 'p',
          title: '压差与流速',
          xLabel: 't',
          leftLabel: 'ΔP,v',
          series: [
            { key: 'dP', label: 'ΔP', color: '#a78bfa', unit: '' },
            { key: 'v2', label: 'v₂', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'v1', label: 'v₁', unit: '', tone: 'blue' },
    { key: 'v2', label: 'v₂', unit: '', tone: 'amber' },
    { key: 'dP', label: 'ΔP', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '伯努利方程示意',
    summary: '水平流管：A₁v₁=A₂v₂；窄处流速大、压强低：ΔP=½ρ(v₁²−v₂²)。',
    concept: ['连续性', '伯努利', '压强与流速'],
    objectives: ['缩小 A₂ 看 v₂↑', '读出压差', '播放跟随示踪粒子'],
    formulas: ['A_1 v_1=A_2 v_2', '\\Delta P=\\tfrac12\\rho(v_1^2-v_2^2)'],
    insight: '左宽右窄；粒子在窄段加速；紫=压差。',
    legend: [
      { color: '#38bdf8', label: '管壁' },
      { color: '#fbbf24', label: '示踪粒子' },
    ],
    steps: [
      {
        id: 'narrow',
        title: '收缩',
        body: '减小 A₂，观察 v₂ 与 |ΔP|。',
        formulas: ['v_2'],
        bindings: [
          { labelTex: 'v_2', valueKey: 'v2', unit: '' },
          { labelTex: '\\Delta P', valueKey: 'dP', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'fast',
        prompt: '取 A₂≤0.6 使 v₂ 明显大于 v₁。',
        hint: '缩小窄段。',
        check: { kind: 'paramNear', key: 'A2', target: 0.5, tol: 0.15 },
      },
    ],
  },
}

export function registerBernoulliDemo() {
  registerDemoBundle({
    meta: bernoulliMeta,
    model: createBernoulliModel,
    adapter: createBernoulliAdapter,
  })
}
