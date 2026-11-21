import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createRefractionAdapter } from './refractionAdapter'

/**
 * 反射 / 折射（斯涅尔）：
 *   n₁ sin θ₁ = n₂ sin θ₂；反射角 θᵣ = θ₁。
 *   临界角 θc = arcsin(n₂/n₁)（仅 n₁>n₂）；θ₁>θc 时全反射。
 * 播放：入射角从近法线扫到掠射，观察折射角与全反射。
 */
export function snell(
  n1: number,
  n2: number,
  theta1Deg: number,
): {
  theta1: number
  thetaR: number
  theta2: number
  sin2: number
  critical: number
  tir: boolean
} {
  const theta1 = Math.max(0, Math.min(89.5, theta1Deg))
  const thetaR = theta1
  const s1 = Math.sin((theta1 * Math.PI) / 180)
  const sin2 = (n1 / Math.max(n2, 1e-9)) * s1
  let critical = 90
  if (n1 > n2 + 1e-9) {
    critical = (Math.asin(Math.min(1, n2 / n1)) * 180) / Math.PI
  }
  const tir = sin2 > 1 + 1e-9
  const theta2 = tir ? Number.NaN : (Math.asin(Math.min(1, sin2)) * 180) / Math.PI
  return { theta1, thetaR, theta2, sin2, critical, tir }
}

export function createRefractionModel(): PhysicsModel {
  let n1 = 1
  let n2 = 1.5
  let theta1Max = 75
  let t = 0
  const period = 8

  function thetaAt(time: number) {
    // 0 → theta1Max over one period
    return (theta1Max * time) / period
  }

  return {
    init(params: ParamValues) {
      n1 = Number(params.n1 ?? 1)
      n2 = Number(params.n2 ?? 1.5)
      theta1Max = Number(params.theta1Max ?? 75)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const theta1 = thetaAt(t)
      const s = snell(n1, n2, theta1)
      return {
        time: t,
        values: {
          n1,
          n2,
          theta1Max,
          theta1: s.theta1,
          thetaR: s.thetaR,
          theta2: s.tir ? 0 : s.theta2,
          sin2: s.sin2,
          critical: s.critical,
          tir: s.tir ? 1 : 0,
          ratio: n1 / Math.max(n2, 1e-9),
          period,
          tMax: period,
          world: 5,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.n1 !== undefined) n1 = Number(params.n1)
      if (params.n2 !== undefined) n2 = Number(params.n2)
      if (params.theta1Max !== undefined) theta1Max = Number(params.theta1Max)
    },
  }
}

export const refractionMeta: DemoMeta = {
  id: 'opt-refraction',
  subject: '光学',
  category: '几何光学',
  tags: ['折射', '反射', '斯涅尔', '全反射'],
  model: 'refraction',
  adapter: 'refraction',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'n1',
      label: '介质 1 折射率 n₁',
      kind: 'number',
      default: 1,
      min: 1,
      max: 2.4,
      step: 0.05,
      unit: '',
    },
    {
      key: 'n2',
      label: '介质 2 折射率 n₂',
      kind: 'number',
      default: 1.5,
      min: 1,
      max: 2.4,
      step: 0.05,
      unit: '',
    },
    {
      key: 'theta1Max',
      label: '扫描最大入射角',
      kind: 'number',
      default: 75,
      min: 20,
      max: 89,
      step: 1,
      unit: '°',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '光路' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'theta2',
      charts: [
        {
          id: 'angles',
          title: '角度',
          xLabel: 't (s)',
          leftLabel: '°',
          series: [
            { key: 'theta1', label: 'θ₁', color: '#4ade80', unit: '°' },
            { key: 'thetaR', label: 'θᵣ', color: '#fbbf24', unit: '°' },
            { key: 'theta2', label: 'θ₂', color: '#38bdf8', unit: '°' },
            { key: 'critical', label: 'θc', color: '#f472b6', unit: '°' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'theta1', label: 'θ₁', unit: '°', tone: 'green' },
    { key: 'thetaR', label: 'θᵣ', unit: '°', tone: 'amber' },
    { key: 'theta2', label: 'θ₂', unit: '°', tone: 'blue' },
    { key: 'critical', label: 'θc', unit: '°', tone: 'purple' },
    { key: 'tir', label: 'TIR', unit: '', tone: 'slate' },
  ],
  docs: {
    title: '反射折射光路（斯涅尔）',
    summary:
      '界面上法线、入射/反射/折射三线。反射角等于入射角；折射满足 n₁sinθ₁=n₂sinθ₂。密→疏且 θ₁>θc 时全反射。',
    concept: [
      '反射定律：θᵣ = θ₁，入射、反射、法线共面。',
      '斯涅尔：n₁ sin θ₁ = n₂ sin θ₂。',
      'n₁>n₂ 时存在临界角 θc=arcsin(n₂/n₁)；超过则全反射。',
    ],
    objectives: [
      '对照反射角与入射角始终相等',
      '改变 n₁、n₂ 观察折射角变化方向',
      '设 n₁>n₂，拖到 θ₁>θc 看全反射',
    ],
    formulas: [
      '\\theta_r=\\theta_1',
      'n_1\\sin\\theta_1=n_2\\sin\\theta_2',
      '\\theta_c=\\arcsin(n_2/n_1)\\quad(n_1>n_2)',
    ],
    insight:
      '上半=介质1、下半=介质2；虚线=法线。播放扫描入射角：折射光线弯向/远离法线；全反射时折射消失、界面有「消逝」提示。',
    legend: [
      { color: '#4ade80', label: '入射' },
      { color: '#fbbf24', label: '反射' },
      { color: '#38bdf8', label: '折射' },
      { color: '#94a3b8', label: '法线' },
      { color: '#f472b6', label: '临界 / 全反射' },
    ],
    steps: [
      {
        id: 'reflect',
        title: '反射',
        body: '反射光线与法线夹角等于入射角。',
        formulas: ['\\theta_r=\\theta_1'],
        bindings: [
          { labelTex: '\\theta_1', valueKey: 'theta1', unit: '°' },
          { labelTex: '\\theta_r', valueKey: 'thetaR', unit: '°' },
        ],
      },
      {
        id: 'snell',
        title: '斯涅尔',
        body: '折射角由两边折射率与入射角共同决定。',
        formulas: ['n_1\\sin\\theta_1=n_2\\sin\\theta_2'],
        bindings: [
          { labelTex: 'n_1', valueKey: 'n1', unit: '' },
          { labelTex: 'n_2', valueKey: 'n2', unit: '' },
          { labelTex: '\\theta_2', valueKey: 'theta2', unit: '°' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'tir',
        title: '全反射',
        body: '从光密到光疏（n₁>n₂）且 θ₁≥θc 时，折射消失，能量全反射。',
        formulas: ['\\theta_c=\\arcsin(n_2/n_1)'],
        bindings: [
          { labelTex: '\\theta_c', valueKey: 'critical', unit: '°' },
          { labelTex: '\\mathrm{TIR}', valueKey: 'tir', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'equal-reflect',
        prompt: '任意时刻核对 |θᵣ−θ₁|≈0（反射定律）。',
        hint: '播放或拖动时间轴，读数应始终相等。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'theta1', target: 30, tol: 40 },
            { kind: 'valueNear', key: 'thetaR', target: 30, tol: 40 },
          ],
        },
      },
      {
        id: 'tir-demo',
        prompt: '设 n₁=1.5、n₂=1，拖到 θ₁≳42° 使 TIR=1（全反射）。',
        hint: 'θc≈arcsin(1/1.5)≈41.8°。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'n1', target: 1.5, tol: 0.12 },
            { kind: 'paramNear', key: 'n2', target: 1, tol: 0.12 },
            { kind: 'valueNear', key: 'tir', target: 1, tol: 0.2 },
          ],
        },
      },
    ],
  },
}

export function registerRefractionDemo(): void {
  registerDemoBundle({
    meta: refractionMeta,
    model: createRefractionModel,
    adapter: createRefractionAdapter,
  })
}
