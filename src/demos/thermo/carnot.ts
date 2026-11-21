import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCarnotAdapter } from './carnotAdapter'

/** 教学取 nR=1：P=T/V（等温）、P V^γ=const（绝热） */
const NR = 1

export type CarnotCorner = { V: number; P: number; T: number; label: string }

/**
 * 卡诺四点（等温 Th: 1→2，绝热 2→3，等温 Tc: 3→4，绝热 4→1）
 */
export function carnotCorners(
  Th: number,
  Tc: number,
  V1: number,
  r: number,
  gamma: number,
): CarnotCorner[] {
  const th = Math.max(Tc + 0.2, Th)
  const tc = Math.max(0.3, Math.min(Th - 0.2, Tc))
  const v1 = Math.max(0.4, V1)
  const rr = Math.max(1.15, r)
  const g = Math.max(1.2, Math.min(1.67, gamma))
  const v2 = v1 * rr
  const factor = (th / tc) ** (1 / (g - 1))
  const v3 = v2 * factor
  const v4 = v1 * factor
  return [
    { V: v1, P: (NR * th) / v1, T: th, label: '1' },
    { V: v2, P: (NR * th) / v2, T: th, label: '2' },
    { V: v3, P: (NR * tc) / v3, T: tc, label: '3' },
    { V: v4, P: (NR * tc) / v4, T: tc, label: '4' },
  ]
}

/** 沿循环参数 u∈[0,4) 插值状态；每段长度 1 */
export function carnotStateAt(
  u: number,
  Th: number,
  Tc: number,
  V1: number,
  r: number,
  gamma: number,
): {
  V: number
  P: number
  T: number
  stage: number
  stageName: string
  Qh: number
  Qc: number
  W: number
  eta: number
  corners: CarnotCorner[]
} {
  const c = carnotCorners(Th, Tc, V1, r, gamma)
  const g = Math.max(1.2, Math.min(1.67, gamma))
  const Qh = NR * c[0]!.T * Math.log(c[1]!.V / c[0]!.V)
  const Qc = NR * c[2]!.T * Math.log(c[3]!.V / c[2]!.V) // 负（放热）
  const W = Qh + Qc
  const eta = 1 - c[2]!.T / c[0]!.T

  const uu = ((u % 4) + 4) % 4
  const stage = Math.floor(uu)
  const s = uu - stage
  const names = ['等温膨胀 Th', '绝热膨胀', '等温压缩 Tc', '绝热压缩']

  let V: number
  let P: number
  let T: number
  if (stage === 0) {
    // 1→2 等温 Th：V 对数插值更贴等温过程感
    const V0 = c[0]!.V
    const V1b = c[1]!.V
    V = V0 * Math.exp(s * Math.log(V1b / V0))
    T = c[0]!.T
    P = (NR * T) / V
  } else if (stage === 1) {
    const V0 = c[1]!.V
    const V1b = c[2]!.V
    V = V0 * Math.exp(s * Math.log(V1b / V0))
    const K = c[1]!.P * V0 ** g
    P = K / V ** g
    T = (P * V) / NR
  } else if (stage === 2) {
    const V0 = c[2]!.V
    const V1b = c[3]!.V
    V = V0 * Math.exp(s * Math.log(V1b / V0))
    T = c[2]!.T
    P = (NR * T) / V
  } else {
    const V0 = c[3]!.V
    const V1b = c[0]!.V
    V = V0 * Math.exp(s * Math.log(V1b / V0))
    const K = c[3]!.P * V0 ** g
    P = K / V ** g
    T = (P * V) / NR
  }

  return { V, P, T, stage, stageName: names[stage]!, Qh, Qc, W, eta, corners: c }
}

/** 采样整圈曲线供绘图 */
export function sampleCarnotLoop(
  Th: number,
  Tc: number,
  V1: number,
  r: number,
  gamma: number,
  nPerSeg = 36,
): { V: number; P: number }[] {
  const pts: { V: number; P: number }[] = []
  for (let seg = 0; seg < 4; seg++) {
    for (let i = 0; i < nPerSeg; i++) {
      const u = seg + i / nPerSeg
      const s = carnotStateAt(u, Th, Tc, V1, r, gamma)
      pts.push({ V: s.V, P: s.P })
    }
  }
  const close = carnotStateAt(0, Th, Tc, V1, r, gamma)
  pts.push({ V: close.V, P: close.P })
  return pts
}

export function createCarnotModel(): PhysicsModel {
  let Th = 3
  let Tc = 1.2
  let V1 = 1
  let r = 2
  let gamma = 1.4
  let t = 0
  const period = 12 // 4 stages × 3s

  return {
    init(params: ParamValues) {
      Th = Number(params.Th ?? 3)
      Tc = Number(params.Tc ?? 1.2)
      V1 = Number(params.V1 ?? 1)
      r = Number(params.r ?? 2)
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
      const u = (4 * t) / period
      const s = carnotStateAt(u, Th, Tc, V1, r, gamma)
      const loop = sampleCarnotLoop(Th, Tc, V1, r, gamma)
      const Vs = new Float32Array(loop.length)
      const Ps = new Float32Array(loop.length)
      for (let i = 0; i < loop.length; i++) {
        Vs[i] = loop[i]!.V
        Ps[i] = loop[i]!.P
      }
      let Vmin = Infinity
      let Vmax = -Infinity
      let Pmin = Infinity
      let Pmax = -Infinity
      for (const p of loop) {
        Vmin = Math.min(Vmin, p.V)
        Vmax = Math.max(Vmax, p.V)
        Pmin = Math.min(Pmin, p.P)
        Pmax = Math.max(Pmax, p.P)
      }
      return {
        time: t,
        values: {
          Th,
          Tc,
          V1,
          r,
          gamma,
          V: s.V,
          P: s.P,
          T: s.T,
          stage: s.stage,
          Qh: s.Qh,
          Qc: s.Qc,
          W: s.W,
          eta: s.eta,
          etaPct: s.eta * 100,
          c1V: s.corners[0]!.V,
          c1P: s.corners[0]!.P,
          c2V: s.corners[1]!.V,
          c2P: s.corners[1]!.P,
          c3V: s.corners[2]!.V,
          c3P: s.corners[2]!.P,
          c4V: s.corners[3]!.V,
          c4P: s.corners[3]!.P,
          Vs,
          Ps,
          nLoop: loop.length,
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
      if (params.Th !== undefined) Th = Number(params.Th)
      if (params.Tc !== undefined) Tc = Number(params.Tc)
      if (params.V1 !== undefined) V1 = Number(params.V1)
      if (params.r !== undefined) r = Number(params.r)
      if (params.gamma !== undefined) gamma = Number(params.gamma)
    },
  }
}

export const carnotMeta: DemoMeta = {
  id: 'thermo-carnot',
  subject: '热学',
  category: '热力学循环',
  tags: ['卡诺', '效率', 'P-V'],
  model: 'carnot',
  adapter: 'carnot',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'Th',
      label: '高温 Th',
      kind: 'number',
      default: 3,
      min: 2,
      max: 5,
      step: 0.1,
      unit: '',
    },
    {
      key: 'Tc',
      label: '低温 Tc',
      kind: 'number',
      default: 1.2,
      min: 0.5,
      max: 2.5,
      step: 0.1,
      unit: '',
    },
    {
      key: 'V1',
      label: '最小体积 V₁',
      kind: 'number',
      default: 1,
      min: 0.6,
      max: 1.8,
      step: 0.1,
      unit: '',
    },
    {
      key: 'r',
      label: '等温膨胀比 r',
      kind: 'number',
      default: 2,
      min: 1.3,
      max: 3,
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
      chartKey: 'P',
      charts: [
        {
          id: 'cycle',
          title: '状态随时间',
          xLabel: 't (s)',
          leftLabel: 'P / T',
          series: [
            { key: 'P', label: 'P', color: '#f472b6', unit: '' },
            { key: 'T', label: 'T', color: '#fbbf24', unit: '' },
            { key: 'V', label: 'V', color: '#38bdf8', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'stage', label: '段', unit: '', tone: 'slate' },
    { key: 'P', label: 'P', unit: '', tone: 'purple' },
    { key: 'V', label: 'V', unit: '', tone: 'blue' },
    { key: 'T', label: 'T', unit: '', tone: 'amber' },
    { key: 'etaPct', label: 'η%', unit: '', tone: 'green' },
  ],
  docs: {
    title: '卡诺循环 P–V 图',
    summary:
      '理想卡诺：两等温 + 两绝热。效率 η=1−Tc/Th，与体积比无关。播放沿 1→2→3→4→1 扫过状态点。',
    concept: [
      '1→2：Th 等温膨胀吸热 Qh=nR Th ln(V₂/V₁)',
      '2→3：绝热膨胀降温至 Tc',
      '3→4：Tc 等温压缩放热',
      '4→1：绝热压缩回到 Th；η=1−Tc/Th 为同温限下最高效率',
    ],
    objectives: [
      '辨认 P–V 上四段曲线类型',
      '验证 η=1−Tc/Th',
      '改变 Th/Tc 看效率与图形变化',
    ],
    formulas: [
      '\\eta=1-T_c/T_h',
      'Q_h=nR T_h\\ln(V_2/V_1)',
      'PV^\\gamma=\\mathrm{const}\\;(\\text{绝热})',
      'PV=nRT\\;(\\text{等温})',
    ],
    insight:
      '粉点为当前状态；青/金曲线为等温，绿为绝热。顶栏对照 η 与 Qh、W。教学取 nR=1。',
    legend: [
      { color: '#fbbf24', label: '等温 Th / Tc' },
      { color: '#4ade80', label: '绝热' },
      { color: '#f472b6', label: '状态点' },
      { color: '#38bdf8', label: '做功面积示意' },
    ],
    steps: [
      {
        id: 'eta',
        title: '效率',
        body: '卡诺效率只取决于两热源温度。',
        formulas: ['\\eta=1-T_c/T_h'],
        bindings: [
          { labelTex: 'T_h', valueKey: 'Th', unit: '' },
          { labelTex: 'T_c', valueKey: 'Tc', unit: '' },
          { labelTex: '\\eta', valueKey: 'eta', unit: '' },
        ],
      },
      {
        id: 'stages',
        title: '四过程',
        body: '播放扫过四段；读 stage 与当前 T、P、V。',
        formulas: ['1\\to2\\to3\\to4\\to1'],
        bindings: [
          { labelTex: 'stage', valueKey: 'stage', unit: '' },
          { labelTex: 'T', valueKey: 'T', unit: '' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'work',
        title: '功与热',
        body: 'W=Qh+Qc（Qc<0）；环路面积≈净功。',
        formulas: ['W=Q_h+Q_c'],
        bindings: [
          { labelTex: 'Q_h', valueKey: 'Qh', unit: '' },
          { labelTex: 'Q_c', valueKey: 'Qc', unit: '' },
          { labelTex: 'W', valueKey: 'W', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'eta-check',
        prompt: '取 Th=3、Tc=1.2，使 η≈0.6。',
        hint: 'η=1−1.2/3=0.6。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'Th', target: 3, tol: 0.15 },
            { kind: 'paramNear', key: 'Tc', target: 1.2, tol: 0.15 },
            { kind: 'valueNear', key: 'eta', target: 0.6, tol: 0.05 },
          ],
        },
      },
      {
        id: 'isothermal',
        prompt: '拖到第 0 段（等温膨胀），使 T≈Th。',
        hint: '播放前 1/4 段。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'stage', target: 0, tol: 0.2 },
            { kind: 'valueNear', key: 'T', target: 3, tol: 0.35 },
          ],
        },
      },
    ],
  },
}

export function registerCarnotDemo(): void {
  registerDemoBundle({
    meta: carnotMeta,
    model: createCarnotModel,
    adapter: createCarnotAdapter,
  })
}
