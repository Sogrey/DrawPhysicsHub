import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createWaveModesAdapter } from './waveModesAdapter'

/** 两端固定弦：u=sin(nπx/L) cos(ω_n t)，ω_n = n π c / L */
export function stringMode(x: number, L: number, n: number, t: number, c: number, A: number): number {
  const wn = (n * Math.PI * c) / Math.max(1e-6, L)
  return A * Math.sin((n * Math.PI * x) / L) * Math.cos(wn * t)
}

export function createWaveModesModel(): PhysicsModel {
  let n = 2
  let c = 1.2
  let A = 1
  let L = 6
  let t = 0
  const period = 8
  const N = 100

  return {
    init(params: ParamValues) {
      n = Math.round(Number(params.n ?? 2))
      c = Number(params.c ?? 1.2)
      A = Number(params.A ?? 1)
      L = Number(params.L ?? 6)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const path: number[][] = []
      for (let i = 0; i <= N; i++) {
        const x = (L * i) / N
        path.push([x, stringMode(x, L, n, t, c, A)])
      }
      const wn = (n * Math.PI * c) / L
      const nodes = Math.max(0, n - 1)
      return {
        time: t,
        values: {
          n,
          c,
          A,
          L,
          omega: wn,
          f: wn / (2 * Math.PI),
          nodes,
          period,
          tMax: period,
          world: 4,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.n !== undefined) n = Math.round(Number(params.n))
      if (params.c !== undefined) c = Number(params.c)
      if (params.A !== undefined) A = Number(params.A)
      if (params.L !== undefined) L = Number(params.L)
    },
  }
}

export const waveModesMeta: DemoMeta = {
  id: 'math-wave-modes',
  subject: '数理方法',
  category: 'PDE 模态',
  tags: ['波动方程', '本征模'],
  model: 'waveModes',
  adapter: 'waveModes',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'n', label: '模态 n', kind: 'number', default: 2, min: 1, max: 5, step: 1, unit: '' },
    { key: 'c', label: '波速 c', kind: 'number', default: 1.2, min: 0.6, max: 2, step: 0.1, unit: '' },
    { key: 'A', label: '振幅 A', kind: 'number', default: 1, min: 0.3, max: 1.5, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '弦' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '中点',
      chartKey: 'omega',
      charts: [
        {
          id: 'w',
          title: '频率',
          xLabel: 't (s)',
          leftLabel: 'ω',
          series: [{ key: 'omega', label: 'ω_n', color: '#a78bfa', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'n', label: 'n', unit: '', tone: 'purple' },
    { key: 'omega', label: 'ω_n', unit: '', tone: 'amber' },
    { key: 'nodes', label: '节点', unit: '', tone: 'blue' },
  ],
  docs: {
    title: '弦 / 膜振动本征模',
    summary: '两端固定弦本征模 sin(nπx/L)，频率 ω_n=nπc/L。节点数 = n−1。调 n 看驻波花纹。',
    concept: [
      '波动方程分离变量 → 本征模',
      'ω_n ∝ n',
      '节点与腹点',
    ],
    objectives: ['观察不同 n 的驻波', '验证节点数', '联系 ω∝n'],
    formulas: ['u=\\sin\\frac{n\\pi x}{L}\\cos\\omega_n t', '\\omega_n=\\frac{n\\pi c}{L}'],
    insight: '青=弦形；灰点=节点位置示意。',
    legend: [
      { color: '#38bdf8', label: '弦' },
      { color: '#fbbf24', label: '端点' },
    ],
    steps: [
      {
        id: 'nodes',
        title: '节点',
        body: 'n=3 应有 2 个节点。',
        formulas: ['N_{\\mathrm{node}}=n-1'],
        bindings: [
          { labelTex: 'n', valueKey: 'n', unit: '' },
          { labelTex: 'N', valueKey: 'nodes', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'n3',
        prompt: '取 n=3，确认节点数=2。',
        hint: '调模态旋钮。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'n', target: 3, tol: 0.5 },
            { kind: 'valueNear', key: 'nodes', target: 2, tol: 0.5 },
          ],
        },
      },
    ],
  },
}

export function registerWaveModesDemo(): void {
  registerDemoBundle({
    meta: waveModesMeta,
    model: createWaveModesModel,
    adapter: createWaveModesAdapter,
  })
}
