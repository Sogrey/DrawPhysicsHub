import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createNuclearDecayAdapter } from './nuclearDecayAdapter'

/** N(t)=N0 e^{-λt}，T½=ln2/λ */
export function decayLaw(N0: number, lambda: number, t: number): number {
  return N0 * Math.exp(-Math.max(0, lambda) * Math.max(0, t))
}

export function halfLife(lambda: number): number {
  return Math.LN2 / Math.max(1e-9, lambda)
}

export function createNuclearDecayModel(): PhysicsModel {
  let N0 = 100
  let lambda = 0.35
  let t = 0
  const period = 10

  return {
    init(p: ParamValues) {
      N0 = Number(p.N0 ?? 100)
      lambda = Number(p.lambda ?? 0.35)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const N = decayLaw(N0, lambda, t)
      const T12 = halfLife(lambda)
      const path: number[][] = []
      for (let i = 0; i <= 80; i++) {
        const tt = (period * i) / 80
        path.push([tt, decayLaw(N0, lambda, tt)])
      }
      return {
        time: t,
        values: {
          N0,
          lambda,
          N,
          T12,
          survived: N / Math.max(1e-9, N0),
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.N0 !== undefined) N0 = Number(p.N0)
      if (p.lambda !== undefined) lambda = Number(p.lambda)
    },
  }
}

export const nuclearDecayMeta: DemoMeta = {
  id: 'nuclear-decay',
  subject: '近代物理',
  category: '核与粒子',
  tags: ['衰变', '半衰期'],
  model: 'nuclearDecay',
  adapter: 'nuclearDecay',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'N0', label: '初核数 N₀', kind: 'number', default: 100, min: 40, max: 200, step: 10, unit: '' },
    { key: 'lambda', label: '衰变常量 λ', kind: 'number', default: 0.35, min: 0.1, max: 0.8, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '衰变' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'N',
      chartKey: 'N',
      charts: [
        {
          id: 'n',
          title: '存活核数',
          xLabel: 't',
          leftLabel: 'N',
          series: [{ key: 'N', label: 'N', color: '#fbbf24', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'N', label: 'N', unit: '', tone: 'amber' },
    { key: 'T12', label: 'T½', unit: 's', tone: 'purple' },
  ],
  docs: {
    title: '放射性衰变与半衰期',
    summary: 'N=N₀ e^{-λt}，半衰期 T½=ln2/λ。播放看指数衰减。',
    concept: ['衰变常量', '半衰期', '指数律'],
    objectives: ['调 λ 看快慢', '读 T½', '播放过一个半衰期'],
    formulas: ['N=N_0 e^{-\\lambda t}', 'T_{1/2}=\\ln 2/\\lambda'],
    insight: '金曲线=N(t)；虚线标 T½。',
    legend: [{ color: '#fbbf24', label: 'N(t)' }],
    steps: [
      {
        id: 'half',
        title: '半衰期',
        body: '播放至 t≈T½，N 约减半。',
        formulas: ['T_{1/2}'],
        bindings: [
          { labelTex: 'N', valueKey: 'N', unit: '' },
          { labelTex: 'T_{1/2}', valueKey: 'T12', unit: 's' },
        ],
      },
    ],
    challenges: [
      {
        id: 'fast',
        prompt: '取 λ≥0.6 加快衰变。',
        hint: '调大 λ。',
        check: { kind: 'paramNear', key: 'lambda', target: 0.7, tol: 0.15 },
      },
    ],
  },
}

export function registerNuclearDecayDemo() {
  registerDemoBundle({
    meta: nuclearDecayMeta,
    model: createNuclearDecayModel,
    adapter: createNuclearDecayAdapter,
  })
}
