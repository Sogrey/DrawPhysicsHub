import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createRcTransientAdapter } from './rcTransientAdapter'

export function rcCharge(V0: number, R: number, C: number, t: number) {
  const tau = Math.max(1e-6, R * C)
  const Vc = V0 * (1 - Math.exp(-t / tau))
  const I = (V0 / R) * Math.exp(-t / tau)
  return { Vc, I, tau, Q: C * Vc }
}

export function createRcTransientModel(): PhysicsModel {
  let V0 = 5
  let R = 2
  let C = 1.2
  let t = 0
  const period = 10
  return {
    init(p: ParamValues) {
      V0 = Number(p.V0 ?? 5)
      R = Number(p.R ?? 2)
      C = Number(p.C ?? 1.2)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const s = rcCharge(V0, R, C, t)
      return {
        time: t,
        values: { V0, R, C, ...s, period, tMax: period, done: t >= period - 1e-9 ? 1 : 0 },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.V0 !== undefined) V0 = Number(p.V0)
      if (p.R !== undefined) R = Number(p.R)
      if (p.C !== undefined) C = Number(p.C)
    },
  }
}

export const rcTransientMeta: DemoMeta = {
  id: 'em-rc-transient',
  subject: '电磁学',
  category: '交流电路',
  tags: ['RC', '暂态'],
  model: 'rcTransient',
  adapter: 'rcTransient',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'V0', label: 'V₀', kind: 'number', default: 5, min: 2, max: 8, step: 0.5, unit: '' },
    { key: 'R', label: 'R', kind: 'number', default: 2, min: 0.5, max: 5, step: 0.25, unit: '' },
    { key: 'C', label: 'C', kind: 'number', default: 1.2, min: 0.4, max: 3, step: 0.2, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'RC' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'Vc',
      chartKey: 'Vc',
      charts: [
        {
          id: 'v',
          title: '充电',
          xLabel: 't',
          leftLabel: 'V/I',
          series: [
            { key: 'Vc', label: 'Vc', color: '#fbbf24', unit: '' },
            { key: 'I', label: 'I', color: '#38bdf8', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'Vc', label: 'Vc', unit: '', tone: 'amber' },
    { key: 'I', label: 'I', unit: '', tone: 'blue' },
    { key: 'tau', label: 'τ', unit: 's', tone: 'purple' },
  ],
  docs: {
    title: 'RC 暂态充放电',
    summary: '电容充电 Vc=V₀(1−e^{−t/τ})，τ=RC。电流指数衰减。',
    concept: ['时间常数 τ=RC', 't≈5τ 近似充满', 'I 初值最大'],
    objectives: ['观察 Vc 上升', '对照 τ', '增大 RC 变慢'],
    formulas: ['V_c=V_0(1-e^{-t/RC})', 'I=(V_0/R)e^{-t/RC}'],
    insight: '金=电容电压条；青=电流。',
    legend: [
      { color: '#fbbf24', label: 'Vc' },
      { color: '#38bdf8', label: 'I' },
    ],
    steps: [
      {
        id: 'tau',
        title: 'τ',
        body: 't=τ 时 Vc≈0.63 V₀。',
        formulas: ['1-e^{-1}\\approx0.63'],
        bindings: [
          { labelTex: 'V_c', valueKey: 'Vc', unit: '' },
          { labelTex: '\\tau', valueKey: 'tau', unit: 's' },
        ],
      },
    ],
    challenges: [
      {
        id: 'fill',
        prompt: '播放使 Vc>0.9 V₀。',
        hint: '拖到后段。',
        check: { kind: 'valueNear', key: 'Vc', target: 4.5, tol: 1.5 },
      },
    ],
  },
}

export function registerRcTransientDemo(): void {
  registerDemoBundle({
    meta: rcTransientMeta,
    model: createRcTransientModel,
    adapter: createRcTransientAdapter,
  })
}
