import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createDisplacementAdapter } from './displacementAdapter'

/** 平行板电容：I_d = ε₀ A dE/dt；充电时导线电流 = 位移电流（连续性） */
export function displacementCurrent(epsA: number, dEdt: number): number {
  return epsA * dEdt
}

export function createDisplacementModel(): PhysicsModel {
  let V0 = 2
  let tau = 2.5
  let area = 1.2
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      V0 = Number(params.V0 ?? 2)
      tau = Number(params.tau ?? 2.5)
      area = Number(params.area ?? 1.2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      // E(t)= (V0/d) (1−e^{−t/τ})，取 d=1 教学单位 → E∝V
      const E = V0 * (1 - Math.exp(-t / Math.max(0.2, tau)))
      const dEdt = (V0 / Math.max(0.2, tau)) * Math.exp(-t / Math.max(0.2, tau))
      const Id = displacementCurrent(area, dEdt)
      const Iwire = Id // 连续
      const Q = area * E // ε₀=1
      return {
        time: t,
        values: {
          V0,
          tau,
          area,
          E,
          dEdt,
          Id,
          Iwire,
          Q,
          gap: 0.8,
          period,
          tMax: period,
          world: 4,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.V0 !== undefined) V0 = Number(params.V0)
      if (params.tau !== undefined) tau = Number(params.tau)
      if (params.area !== undefined) area = Number(params.area)
    },
  }
}

export const displacementMeta: DemoMeta = {
  id: 'em-displacement',
  subject: '电磁学',
  category: '电磁波',
  tags: ['位移电流', '麦克斯韦'],
  model: 'displacement',
  adapter: 'displacement',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'V0', label: '终压 V₀', kind: 'number', default: 2, min: 0.5, max: 3, step: 0.1, unit: '' },
    { key: 'tau', label: '时间常数 τ', kind: 'number', default: 2.5, min: 1, max: 5, step: 0.25, unit: 's' },
    { key: 'area', label: '极板面积 A', kind: 'number', default: 1.2, min: 0.5, max: 2, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '电容' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '电流',
      chartKey: 'Id',
      charts: [
        {
          id: 'i',
          title: '导线 / 位移电流',
          xLabel: 't (s)',
          leftLabel: 'I',
          series: [
            { key: 'Id', label: 'I_d', color: '#a78bfa', unit: '' },
            { key: 'E', label: 'E', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'E', label: 'E', unit: '', tone: 'amber' },
    { key: 'Id', label: 'I_d', unit: '', tone: 'purple' },
    { key: 'Iwire', label: 'I_导线', unit: '', tone: 'green' },
  ],
  docs: {
    title: '位移电流与麦克斯韦修正',
    summary:
      '充电电容：极板间无传导电流，但有 I_d=ε₀A dE/dt。与导线电流连续，补全安培环路，预言电磁波。',
    concept: [
      '位移电流 I_d=ε₀A ∂E/∂t',
      '导线电流 = 极板间位移电流（连续）',
      '麦克斯韦修正 → 电磁波',
    ],
    objectives: ['观察 E 上升时 I_d 衰减', '确认 I_导线≈I_d', '理解间隙中的“电流”'],
    formulas: ['I_d=\\varepsilon_0 A\\frac{\\partial E}{\\partial t}', 'I_{\\mathrm{wire}}=I_d'],
    insight: '金=E 场线；紫箭头=位移电流。充电初期 I_d 最大。',
    legend: [
      { color: '#fbbf24', label: 'E' },
      { color: '#a78bfa', label: 'I_d' },
      { color: '#4ade80', label: '导线电流' },
    ],
    steps: [
      {
        id: 'early',
        title: '初期',
        body: 't≪τ 时 dE/dt 大 → I_d 大。',
        formulas: ['I_d\\propto e^{-t/\\tau}'],
        bindings: [
          { labelTex: 'I_d', valueKey: 'Id', unit: '' },
          { labelTex: 'E', valueKey: 'E', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'decay',
        prompt: '播放至后半段，使 I_d 明显小于初值。',
        hint: '拖到 t≈τ 之后。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 't', target: 4, tol: 4 },
            { kind: 'valueNear', key: 'Id', target: 0.2, tol: 0.5 },
          ],
        },
      },
    ],
  },
}

export function registerDisplacementDemo(): void {
  registerDemoBundle({
    meta: displacementMeta,
    model: createDisplacementModel,
    adapter: createDisplacementAdapter,
  })
}
