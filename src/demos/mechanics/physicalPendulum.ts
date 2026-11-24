import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createPhysicalPendulumAdapter } from './physicalPendulumAdapter'

/** 复摆小角：T=2π√(I/(mgd))，等效摆长 L_eq=I/(md) */
export function physicalPeriod(I: number, m: number, d: number, g = 9.8): number {
  return 2 * Math.PI * Math.sqrt(I / Math.max(1e-6, m * g * d))
}

export function createPhysicalPendulumModel(): PhysicsModel {
  let m = 1
  let L = 2 // rod length
  let pivot = 0.3 // distance from end to pivot along rod
  let amp = 18
  let t = 0
  const play = 10

  function Icm() {
    return (m * L * L) / 12
  }
  function d() {
    // COM at L/2 from end; distance from pivot to COM
    return Math.abs(L / 2 - pivot)
  }
  function I() {
    return Icm() + m * d() * d()
  }

  return {
    init(params: ParamValues) {
      m = Number(params.m ?? 1)
      L = Number(params.L ?? 2)
      pivot = Number(params.pivot ?? 0.3)
      amp = Number(params.amp ?? 18)
      t = 0
    },
    step(dt: number) {
      t = Math.min(play, t + dt)
    },
    seek(time: number) {
      t = Math.min(play, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const II = I()
      const dd = d()
      const T = physicalPeriod(II, m, dd)
      const w = (2 * Math.PI) / Math.max(1e-6, T)
      const th = ((amp * Math.PI) / 180) * Math.cos(w * t)
      const Leq = II / Math.max(1e-6, m * dd)
      // rod endpoints relative pivot
      const x1 = -pivot * Math.sin(th)
      const y1 = pivot * Math.cos(th)
      const x2 = (L - pivot) * Math.sin(th)
      const y2 = -(L - pivot) * Math.cos(th)
      return {
        time: t,
        values: {
          m,
          L,
          pivot,
          amp,
          theta: (th * 180) / Math.PI,
          T,
          Leq,
          I: II,
          d: dd,
          x1,
          y1,
          x2,
          y2,
          tMax: play,
          period: play,
          done: t >= play - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.m !== undefined) m = Number(params.m)
      if (params.L !== undefined) L = Number(params.L)
      if (params.pivot !== undefined) pivot = Number(params.pivot)
      if (params.amp !== undefined) amp = Number(params.amp)
    },
  }
}

export const physicalPendulumMeta: DemoMeta = {
  id: 'mech-physical-pendulum',
  subject: '力学',
  category: '刚体力学',
  tags: ['复摆', '转动惯量'],
  model: 'physicalPendulum',
  adapter: 'physicalPendulum',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'L', label: '杆长 L', kind: 'number', default: 2, min: 1.2, max: 3, step: 0.1, unit: '' },
    { key: 'pivot', label: '支点距端', kind: 'number', default: 0.3, min: 0.1, max: 1.2, step: 0.05, unit: '' },
    { key: 'amp', label: '振幅', kind: 'number', default: 18, min: 5, max: 30, step: 1, unit: '°' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '复摆' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'θ',
      chartKey: 'theta',
      charts: [
        {
          id: 'th',
          title: '角位移',
          xLabel: 't',
          leftLabel: 'θ',
          series: [{ key: 'theta', label: 'θ', color: '#a78bfa', unit: '°' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'T', label: 'T', unit: 's', tone: 'amber' },
    { key: 'Leq', label: 'L_eq', unit: '', tone: 'purple' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'blue' },
  ],
  docs: {
    title: '复摆与等效摆长',
    summary: '刚体绕固定轴小角摆动：T=2π√(I/mgd)，L_eq=I/(md)。调支点改变周期。',
    concept: ['I 含平行轴定理', '等效单摆长 L_eq', '支点位置影响 T'],
    objectives: ['读出 T 与 L_eq', '移动支点看周期变化', '对照单摆'],
    formulas: ['T=2\\pi\\sqrt{I/(mgd)}', 'L_{\\mathrm{eq}}=I/(md)'],
    insight: '紫=杆；金=支点。L_eq 可与同周期单摆对比。',
    legend: [
      { color: '#a78bfa', label: '杆' },
      { color: '#fbbf24', label: '支点' },
    ],
    steps: [
      {
        id: 'pivot',
        title: '支点',
        body: '改变 pivot，观察 T。',
        formulas: ['d=|L/2-\\mathrm{pivot}|'],
        bindings: [
          { labelTex: 'T', valueKey: 'T', unit: 's' },
          { labelTex: 'L_{eq}', valueKey: 'Leq', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'mid',
        prompt: '取支点接近中点，使 d 较小、T 较大。',
        hint: 'pivot≈L/2。',
        check: { kind: 'paramNear', key: 'pivot', target: 1.0, tol: 0.4 },
      },
    ],
  },
}

export function registerPhysicalPendulumDemo(): void {
  registerDemoBundle({
    meta: physicalPendulumMeta,
    model: createPhysicalPendulumModel,
    adapter: createPhysicalPendulumAdapter,
  })
}
