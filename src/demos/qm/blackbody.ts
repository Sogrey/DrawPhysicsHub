import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createBlackbodyAdapter } from './blackbodyAdapter'

/** 教学单位：Planck u(λ,T)= (2hc²/λ⁵)/(e^{hc/λkT}-1) 取 h=c=k=1 → 2/λ⁵/(e^{1/(λT)}-1) */
export function planckSpectral(lambda: number, T: number): number {
  const L = Math.max(0.05, lambda)
  const TT = Math.max(0.1, T)
  const x = 1 / (L * TT)
  if (x > 40) return 0
  return (2 / (L * L * L * L * L)) / (Math.exp(x) - 1)
}

/** Wien: λ_max T ≈ 0.289（教学 h=c=k=1 时峰值约在 λT≈0.289；用数值搜峰） */
export function wienPeakLambda(T: number): number {
  const TT = Math.max(0.1, T)
  let bestL = 0.2
  let bestU = -1
  for (let i = 1; i < 200; i++) {
    const L = 0.05 + (i / 200) * 4
    const u = planckSpectral(L, TT)
    if (u > bestU) {
      bestU = u
      bestL = L
    }
  }
  return bestL
}

const NS = 100

export function createBlackbodyModel(): PhysicsModel {
  let T = 1.2
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      T = Number(params.T ?? 1.2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const lamMax = wienPeakLambda(T)
      const curveL = new Float32Array(NS)
      const curveU = new Float32Array(NS)
      let uMax = 0.01
      const lMaxPlot = Math.max(3.5, lamMax * 3)
      for (let i = 0; i < NS; i++) {
        const L = 0.08 + ((lMaxPlot - 0.08) * i) / (NS - 1)
        const u = planckSpectral(L, T)
        curveL[i] = L
        curveU[i] = u
        uMax = Math.max(uMax, u)
      }
      // reveal curve with time
      const reveal = Math.max(2, Math.floor((t / period) * (NS - 1)) + 1)
      return {
        time: t,
        values: {
          T,
          lamMax,
          lamT: lamMax * T,
          uMax,
          lMaxPlot,
          nSamp: NS,
          reveal,
          curveL,
          curveU,
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
      if (params.T !== undefined) T = Number(params.T)
    },
  }
}

export const blackbodyMeta: DemoMeta = {
  id: 'qm-blackbody',
  subject: '量子力学',
  category: '近代实验',
  tags: ['黑体', '普朗克', '维恩'],
  model: 'blackbody',
  adapter: 'blackbody',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'T', label: '温度 T', kind: 'number', default: 1.2, min: 0.6, max: 2.5, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '光谱' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '峰值',
      chartKey: 'lamMax',
      charts: [
        {
          id: 'peak',
          title: '维恩峰',
          xLabel: 't (s)',
          leftLabel: 'λmax',
          series: [
            { key: 'lamMax', label: 'λmax', color: '#fbbf24', unit: '' },
            { key: 'lamT', label: 'λmax·T', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'T', label: 'T', unit: '', tone: 'amber' },
    { key: 'lamMax', label: 'λmax', unit: '', tone: 'purple' },
    { key: 'lamT', label: 'λT', unit: '', tone: 'blue' },
  ],
  docs: {
    title: '黑体辐射曲线',
    summary: '普朗克光谱随 T 变化；维恩位移：λmax∝1/T。教学 h=c=k=1。播放逐渐揭示曲线。',
    concept: [
      '高温曲线峰值左移、整体升高',
      'λmax·T 近似常数（维恩定律）',
      '经典瑞利-金斯在短波发散，普朗克公式解决紫外灾难',
    ],
    objectives: ['观察 T 升高峰值蓝移', '读 λmax·T 近似不变', '辨认光谱曲线形状'],
    formulas: [
      'u(\\lambda,T)=\\frac{2hc^2/\\lambda^5}{e^{hc/\\lambda kT}-1}',
      '\\lambda_{\\max}T\\approx\\mathrm{const}',
    ],
    insight: '金线为普朗克曲线；粉竖线标 λmax。教学单位下常数与 SI 数值不同，看标度关系。',
    legend: [
      { color: '#fbbf24', label: '普朗克曲线' },
      { color: '#f472b6', label: 'λmax' },
    ],
    steps: [
      {
        id: 'wien',
        title: '维恩位移',
        body: '改变 T，观察 λmax 与 λmax·T。',
        formulas: ['\\lambda_{\\max}\\propto 1/T'],
        bindings: [
          { labelTex: 'T', valueKey: 'T', unit: '' },
          { labelTex: '\\lambda_{\\max}', valueKey: 'lamMax', unit: '' },
          { labelTex: '\\lambda T', valueKey: 'lamT', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'hotter',
        prompt: '把 T 调到约 2.0，使 λmax 明显小于 T=1.0 时。',
        hint: '更高 T → 更小 λmax。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'T', target: 2, tol: 0.25 },
            { kind: 'valueNear', key: 'lamMax', target: wienPeakLambda(2), tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerBlackbodyDemo(): void {
  registerDemoBundle({
    meta: blackbodyMeta,
    model: createBlackbodyModel,
    adapter: createBlackbodyAdapter,
  })
}
