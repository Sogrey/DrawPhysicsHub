import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createDiffusionAdapter } from './diffusionAdapter'

const MAX_N = 60

/** 随机行走扩散：⟨r²⟩≈ 2 d D t（二维 d=2 → 4Dt 常用；本示意 ⟨r²⟩∝ t） */
export function createDiffusionModel(): PhysicsModel {
  let N = 40
  let D = 0.35
  let t = 0
  const period = 10
  let xs = new Float32Array(MAX_N)
  let ys = new Float32Array(MAX_N)

  function seed() {
    xs = new Float32Array(MAX_N)
    ys = new Float32Array(MAX_N)
  }

  function meanR2() {
    let s = 0
    for (let i = 0; i < N; i++) s += xs[i]! * xs[i]! + ys[i]! * ys[i]!
    return N > 0 ? s / N : 0
  }

  return {
    init(params: ParamValues) {
      N = Math.min(MAX_N, Math.max(8, Math.round(Number(params.N ?? 40))))
      D = Number(params.D ?? 0.35)
      t = 0
      seed()
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
      const sigma = Math.sqrt(2 * Math.max(0.05, D) * dt)
      for (let i = 0; i < N; i++) {
        // Box-Muller
        const u1 = Math.random() || 1e-12
        const u2 = Math.random()
        const g1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        const g2 = Math.sqrt(-2 * Math.log(Math.random() || 1e-12)) * Math.cos(2 * Math.PI * Math.random())
        xs[i]! += sigma * g1
        ys[i]! += sigma * g2
      }
    },
    seek(time: number) {
      const target = Math.min(period, Math.max(0, time))
      if (target < t - 1e-6) {
        t = 0
        seed()
      }
      const dt = target - t
      if (dt > 1e-9) {
        // coarse jump for scrub
        const sigma = Math.sqrt(2 * Math.max(0.05, D) * dt)
        for (let i = 0; i < N; i++) {
          const u1 = Math.random() || 1e-12
          const u2 = Math.random()
          const g1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
          const g2 = Math.sqrt(-2 * Math.log(Math.random() || 1e-12)) * Math.cos(2 * Math.PI * Math.random())
          xs[i]! += sigma * g1
          ys[i]! += sigma * g2
        }
        t = target
      }
    },
    observe(): ObserveSnapshot {
      const r2 = meanR2()
      const r2Theory = 4 * D * t
      const outX = new Float32Array(N)
      const outY = new Float32Array(N)
      for (let i = 0; i < N; i++) {
        outX[i] = xs[i]!
        outY[i] = ys[i]!
      }
      return {
        time: t,
        values: {
          N,
          D,
          r2,
          r2Theory,
          xs: outX,
          ys: outY,
          period,
          tMax: period,
          world: 5,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
      seed()
    },
    setParams(params) {
      if (params.N !== undefined) {
        N = Math.min(MAX_N, Math.max(8, Math.round(Number(params.N))))
        seed()
      }
      if (params.D !== undefined) D = Number(params.D)
    },
  }
}

export const diffusionMeta: DemoMeta = {
  id: 'thermo-diffusion',
  subject: '热学',
  category: '分子动理论',
  tags: ['扩散', '随机行走', '均方位移'],
  model: 'diffusion',
  adapter: 'diffusion',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'N', label: '粒子数 N', kind: 'number', default: 40, min: 10, max: MAX_N, step: 5, unit: '' },
    { key: 'D', label: '扩散系数 D', kind: 'number', default: 0.35, min: 0.1, max: 0.8, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '扩散' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '⟨r²⟩',
      chartKey: 'r2',
      charts: [
        {
          id: 'r2',
          title: '均方位移',
          xLabel: 't (s)',
          leftLabel: '⟨r²⟩',
          series: [
            { key: 'r2', label: '⟨r²⟩测', color: '#38bdf8', unit: '' },
            { key: 'r2Theory', label: '4Dt', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'D', label: 'D', unit: '', tone: 'amber' },
    { key: 'r2', label: '⟨r²⟩', unit: '', tone: 'blue' },
    { key: 'r2Theory', label: '4Dt', unit: '', tone: 'green' },
    { key: 'N', label: 'N', unit: '', tone: 'slate' },
  ],
  docs: {
    title: '扩散与均方位移',
    summary: '二维布朗粒子从原点出发；⟨r²⟩≈4Dt。增大 D 使云更快铺开。N≤60 性能护栏。',
    concept: [
      '扩散可用随机行走描述',
      '均方位移随时间近似线性增长',
      '扩散系数 D 控制铺展快慢',
    ],
    objectives: ['观察粒子云随时间扩张', '对照 ⟨r²⟩ 与 4Dt', '改变 D 看斜率变化'],
    formulas: ['\\langle r^2\\rangle=4Dt\\ (2D)', 'x_{t+\\Delta t}=x_t+\\sqrt{2D\\Delta t}\\,\\xi'],
    insight: '金虚线圆半径≈√(4Dt)；青点为粒子。',
    legend: [
      { color: '#38bdf8', label: '粒子' },
      { color: '#fbbf24', label: '√(4Dt) 圆' },
    ],
    steps: [
      {
        id: 'msd',
        title: '均方位移',
        body: '播放后读 ⟨r²⟩ 并与 4Dt 对照。',
        formulas: ['\\langle r^2\\rangle=4Dt'],
        bindings: [
          { labelTex: '\\langle r^2\\rangle', valueKey: 'r2', unit: '' },
          { labelTex: '4Dt', valueKey: 'r2Theory', unit: '' },
        ],
        highlightOn: 'scrub',
      },
    ],
    challenges: [
      {
        id: 'd-slope',
        prompt: '取 D=0.5，播到接近结束，使 4Dt≈20。',
        hint: '4×0.5×10=20。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'D', target: 0.5, tol: 0.08 },
            { kind: 'valueNear', key: 'r2Theory', target: 18, tol: 4 },
          ],
        },
      },
    ],
  },
}

export function registerDiffusionDemo(): void {
  registerDemoBundle({
    meta: diffusionMeta,
    model: createDiffusionModel,
    adapter: createDiffusionAdapter,
  })
}
