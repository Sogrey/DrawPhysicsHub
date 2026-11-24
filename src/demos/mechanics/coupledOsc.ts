import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCoupledOscAdapter } from './coupledOscAdapter'

/** 两质点三弹簧：ω±=√((κ±κc)/m) 简正模；对称/反对称 */
export function normalFreqs(k: number, kc: number, m: number) {
  const wSym = Math.sqrt((k + 0) / Math.max(1e-6, m)) // 同相近似 √(k/m) 当墙弹簧 k、耦合 kc
  // 标准：墙-κ-m-κc-m-κ-墙 → ω²=(κ+κc±κc)/m
  const w1 = Math.sqrt((k + 2 * kc) / Math.max(1e-6, m)) // 反对称（更高）
  const w2 = Math.sqrt(k / Math.max(1e-6, m)) // 对称
  return { wSym: w2, wAsym: w1 }
}

export function createCoupledOscModel(): PhysicsModel {
  let m = 1
  let k = 1.2
  let kc = 0.6
  let mode = 1 // 1=sym, 2=asym, 3=mix
  let A = 0.8
  let t = 0
  const period = 10

  return {
    init(params: ParamValues) {
      m = Number(params.m ?? 1)
      k = Number(params.k ?? 1.2)
      kc = Number(params.kc ?? 0.6)
      mode = Number(params.mode ?? 1)
      A = Number(params.A ?? 0.8)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const { wSym, wAsym } = normalFreqs(k, kc, m)
      let x1: number
      let x2: number
      if (mode < 1.5) {
        x1 = A * Math.cos(wSym * t)
        x2 = A * Math.cos(wSym * t)
      } else if (mode < 2.5) {
        x1 = A * Math.cos(wAsym * t)
        x2 = -A * Math.cos(wAsym * t)
      } else {
        x1 = A * (Math.cos(wSym * t) + 0.6 * Math.cos(wAsym * t))
        x2 = A * (Math.cos(wSym * t) - 0.6 * Math.cos(wAsym * t))
      }
      return {
        time: t,
        values: {
          m,
          k,
          kc,
          mode,
          A,
          x1,
          x2,
          wSym,
          wAsym,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.m !== undefined) m = Number(params.m)
      if (params.k !== undefined) k = Number(params.k)
      if (params.kc !== undefined) kc = Number(params.kc)
      if (params.mode !== undefined) mode = Number(params.mode)
      if (params.A !== undefined) A = Number(params.A)
    },
  }
}

export const coupledOscMeta: DemoMeta = {
  id: 'mech-coupled-osc',
  subject: '力学',
  category: '振动',
  tags: ['耦合', '简正模'],
  model: 'coupledOsc',
  adapter: 'coupledOsc',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'kc', label: '耦合 κc', kind: 'number', default: 0.6, min: 0.1, max: 1.5, step: 0.1, unit: '' },
    { key: 'k', label: '墙弹簧 κ', kind: 'number', default: 1.2, min: 0.5, max: 2.5, step: 0.1, unit: '' },
    { key: 'mode', label: '模(1对称/2反对称/3混合)', kind: 'number', default: 1, min: 1, max: 3, step: 1, unit: '' },
    { key: 'A', label: '振幅', kind: 'number', default: 0.8, min: 0.3, max: 1.2, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '耦合' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'x',
      chartKey: 'x1',
      charts: [
        {
          id: 'x',
          title: '位移',
          xLabel: 't',
          leftLabel: 'x',
          series: [
            { key: 'x1', label: 'x₁', color: '#38bdf8', unit: '' },
            { key: 'x2', label: 'x₂', color: '#f472b6', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'wSym', label: 'ω_s', unit: '', tone: 'blue' },
    { key: 'wAsym', label: 'ω_a', unit: '', tone: 'pink' },
    { key: 'mode', label: 'mode', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '耦合振子与简正模',
    summary: '两质点经耦合弹簧相连。对称模同相、反对称模反相；混合模出现拍。',
    concept: ['简正模解耦运动', '对称 / 反对称', '混合 → 能量交换'],
    objectives: ['对比两种简正模', '观察混合模拍频', '看 κc 拉开频率差'],
    formulas: ['\\omega_s=\\sqrt{\\kappa/m}', '\\omega_a=\\sqrt{(\\kappa+2\\kappa_c)/m}'],
    insight: '青/粉两质点；mode=3 时可见能量来回传递。',
    legend: [
      { color: '#38bdf8', label: 'm₁' },
      { color: '#f472b6', label: 'm₂' },
    ],
    steps: [
      {
        id: 'asym',
        title: '反对称',
        body: 'mode=2，两球反相。',
        formulas: ['x_2=-x_1'],
        bindings: [
          { labelTex: 'x_1', valueKey: 'x1', unit: '' },
          { labelTex: 'x_2', valueKey: 'x2', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'mix',
        prompt: '取 mode=3，播放观察拍。',
        hint: '混合初条件。',
        check: { kind: 'paramNear', key: 'mode', target: 3, tol: 0.5 },
      },
    ],
  },
}

export function registerCoupledOscDemo(): void {
  registerDemoBundle({
    meta: coupledOscMeta,
    model: createCoupledOscModel,
    adapter: createCoupledOscAdapter,
  })
}
