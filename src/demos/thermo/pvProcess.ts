import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createPvProcessAdapter } from './pvProcessAdapter'

const NR = 1

export type ProcessKind = 'isothermal' | 'isobaric' | 'isochoric' | 'adiabatic'

export function clampProcess(p: string): ProcessKind {
  if (p === 'isobaric' || p === 'isochoric' || p === 'adiabatic') return p
  return 'isothermal'
}

/** 准静态过程：从 (V0,P0) 沿选定路径到终点；nR=1，绝热 γ 可调 */
export function processState(
  kind: ProcessKind,
  u: number,
  V0: number,
  P0: number,
  V1: number,
  gamma: number,
): { V: number; P: number; T: number; W: number; Q: number; dU: number } {
  const g = Math.max(1.2, Math.min(1.67, gamma))
  const v0 = Math.max(0.4, V0)
  const p0 = Math.max(0.2, P0)
  const v1 = Math.max(0.4, V1)
  const T0 = (p0 * v0) / NR
  const s = Math.min(1, Math.max(0, u))

  if (kind === 'isothermal') {
    const V = v0 * Math.pow(v1 / v0, s)
    const P = (NR * T0) / V
    const W = NR * T0 * Math.log(V / v0)
    return { V, P, T: T0, W, Q: W, dU: 0 }
  }
  if (kind === 'isobaric') {
    const V = v0 + (v1 - v0) * s
    const P = p0
    const T = (P * V) / NR
    const W = p0 * (V - v0)
    const Cv = NR / (g - 1)
    const dU = Cv * (T - T0)
    const Q = dU + W
    return { V, P, T, W, Q, dU }
  }
  if (kind === 'isochoric') {
    const V = v0
    // 用 V1 参数映射为压强比：P1 = P0 * (V1/V0) 作为终点压强标度
    const p1 = p0 * (v1 / v0)
    const P = p0 + (p1 - p0) * s
    const T = (P * V) / NR
    const Cv = NR / (g - 1)
    const dU = Cv * (T - T0)
    return { V, P, T, W: 0, Q: dU, dU }
  }
  // adiabatic: P V^γ = const
  const V = v0 * Math.pow(v1 / v0, s)
  const P = p0 * Math.pow(v0 / V, g)
  const T = (P * V) / NR
  const Cv = NR / (g - 1)
  const dU = Cv * (T - T0)
  const W = -dU
  return { V, P, T, W, Q: 0, dU }
}

export function processPath(
  kind: ProcessKind,
  V0: number,
  P0: number,
  V1: number,
  gamma: number,
  n = 64,
): { Vs: Float32Array; Ps: Float32Array } {
  const Vs = new Float32Array(n)
  const Ps = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const s = processState(kind, i / (n - 1), V0, P0, V1, gamma)
    Vs[i] = s.V
    Ps[i] = s.P
  }
  return { Vs, Ps }
}

export function createPvProcessModel(): PhysicsModel {
  let kind: ProcessKind = 'isothermal'
  let V0 = 1.2
  let P0 = 2.5
  let V1 = 3.2
  let gamma = 1.4
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      kind = clampProcess(String(params.process ?? 'isothermal'))
      V0 = Number(params.V0 ?? 1.2)
      P0 = Number(params.P0 ?? 2.5)
      V1 = Number(params.V1 ?? 3.2)
      gamma = Number(params.gamma ?? 1.4)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const u = t / period
      const s = processState(kind, u, V0, P0, V1, gamma)
      const path = processPath(kind, V0, P0, V1, gamma)
      let Vmin = Infinity
      let Vmax = -Infinity
      let Pmin = Infinity
      let Pmax = -Infinity
      for (let i = 0; i < path.Vs.length; i++) {
        Vmin = Math.min(Vmin, path.Vs[i]!)
        Vmax = Math.max(Vmax, path.Vs[i]!)
        Pmin = Math.min(Pmin, path.Ps[i]!)
        Pmax = Math.max(Pmax, path.Ps[i]!)
      }
      const kindId =
        kind === 'isothermal' ? 0 : kind === 'isobaric' ? 1 : kind === 'isochoric' ? 2 : 3
      return {
        time: t,
        values: {
          kindId,
          V0,
          P0,
          V1,
          gamma,
          V: s.V,
          P: s.P,
          T: s.T,
          W: s.W,
          Q: s.Q,
          dU: s.dU,
          u,
          Vs: path.Vs,
          Ps: path.Ps,
          nPath: path.Vs.length,
          Vmin,
          Vmax,
          Pmin,
          Pmax,
          period,
          tMax: period,
          world: 6,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.process !== undefined) kind = clampProcess(String(params.process))
      if (params.V0 !== undefined) V0 = Number(params.V0)
      if (params.P0 !== undefined) P0 = Number(params.P0)
      if (params.V1 !== undefined) V1 = Number(params.V1)
      if (params.gamma !== undefined) gamma = Number(params.gamma)
    },
  }
}

export const pvProcessMeta: DemoMeta = {
  id: 'thermo-pv-process',
  subject: '热学',
  category: '热力学过程',
  tags: ['准静态', 'P-V', '功'],
  model: 'pvProcess',
  adapter: 'pvProcess',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    {
      key: 'process',
      label: '过程类型',
      kind: 'select',
      default: 'isothermal',
      options: [
        { value: 'isothermal', label: '等温' },
        { value: 'isobaric', label: '等压' },
        { value: 'isochoric', label: '等容' },
        { value: 'adiabatic', label: '绝热' },
      ],
    },
    {
      key: 'V0',
      label: '初体积 V₀',
      kind: 'number',
      default: 1.2,
      min: 0.6,
      max: 2.5,
      step: 0.1,
      unit: '',
    },
    {
      key: 'P0',
      label: '初压强 P₀',
      kind: 'number',
      default: 2.5,
      min: 1,
      max: 4,
      step: 0.1,
      unit: '',
    },
    {
      key: 'V1',
      label: '末体积 V₁',
      kind: 'number',
      default: 3.2,
      min: 1,
      max: 5,
      step: 0.1,
      unit: '',
    },
    {
      key: 'gamma',
      label: '绝热指数 γ',
      kind: 'number',
      default: 1.4,
      min: 1.3,
      max: 1.67,
      step: 0.01,
      unit: '',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'P–V' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'W',
      charts: [
        {
          id: 'wq',
          title: '功与热',
          xLabel: 't (s)',
          leftLabel: 'W / Q / ΔU',
          series: [
            { key: 'W', label: 'W', color: '#38bdf8', unit: '' },
            { key: 'Q', label: 'Q', color: '#fbbf24', unit: '' },
            { key: 'dU', label: 'ΔU', color: '#f472b6', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'kindId', label: '型', unit: '', tone: 'slate' },
    { key: 'P', label: 'P', unit: '', tone: 'purple' },
    { key: 'V', label: 'V', unit: '', tone: 'blue' },
    { key: 'T', label: 'T', unit: '', tone: 'amber' },
    { key: 'W', label: 'W', unit: '', tone: 'green' },
  ],
  docs: {
    title: '准静态过程功（P–V）',
    summary:
      '在 P–V 图上选择等温 / 等压 / 等容 / 绝热，播放扫过路径；阴影面积表示累计功 W=∫P dV（等容 W=0）。',
    concept: [
      '准静态过程可用状态方程上的一条路径描述',
      '气体对外做功 W=∫P dV，对应曲线下面积',
      '第一定律 ΔU=Q−W（本演示符号：W 为系统对外做功）',
    ],
    objectives: [
      '区分四类过程在 P–V 上的形状',
      '验证等温 W=nRT ln(V/V₀)',
      '确认等容 W=0、绝热 Q=0',
    ],
    formulas: [
      'W=\\int P\\,dV',
      'W_{T}=nRT\\ln(V/V_0)',
      'PV^\\gamma=\\mathrm{const}',
      '\\Delta U=Q-W',
    ],
    insight: '教学 nR=1。等容时用 V₁/V₀ 作为末压比标度。粉点为当前状态；青面积为已走过路径下的功示意。',
    legend: [
      { color: '#fbbf24', label: '过程路径' },
      { color: '#38bdf8', label: '功面积' },
      { color: '#f472b6', label: '状态点' },
    ],
    steps: [
      {
        id: 'path',
        title: '选过程',
        body: '切换过程类型，观察曲线形状变化。',
        formulas: ['P=P(V)'],
        bindings: [
          { labelTex: 'V', valueKey: 'V', unit: '' },
          { labelTex: 'P', valueKey: 'P', unit: '' },
        ],
      },
      {
        id: 'work',
        title: '累计功',
        body: '播放时 W 随路径积分增长；等容保持 0。',
        formulas: ['W=\\int P\\,dV'],
        bindings: [
          { labelTex: 'W', valueKey: 'W', unit: '' },
          { labelTex: 'Q', valueKey: 'Q', unit: '' },
          { labelTex: '\\Delta U', valueKey: 'dU', unit: '' },
        ],
        highlightOn: 'scrub',
      },
    ],
    challenges: [
      {
        id: 'isothermal-work',
        prompt: '等温：V₀=1.2、V₁=3.2、P₀=2.5，播完后 W≈ nRT ln(V₁/V₀)。',
        hint: 'T=P₀V₀；W=T ln(V₁/V₀)。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'V0', target: 1.2, tol: 0.15 },
            { kind: 'paramNear', key: 'V1', target: 3.2, tol: 0.2 },
            { kind: 'valueNear', key: 'done', target: 1, tol: 0.05 },
            {
              kind: 'valueNear',
              key: 'W',
              target: 2.5 * 1.2 * Math.log(3.2 / 1.2),
              tol: 0.25,
            },
          ],
        },
      },
      {
        id: 'isochoric-zero',
        prompt: '选等容过程，确认 W≈0。',
        hint: '过程类型选「等容」。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'kindId', target: 2, tol: 0.2 },
            { kind: 'valueNear', key: 'W', target: 0, tol: 0.05 },
          ],
        },
      },
    ],
  },
}

export function registerPvProcessDemo(): void {
  registerDemoBundle({
    meta: pvProcessMeta,
    model: createPvProcessModel,
    adapter: createPvProcessAdapter,
  })
}
