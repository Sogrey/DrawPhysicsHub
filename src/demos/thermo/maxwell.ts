import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createMaxwellAdapter } from './maxwellAdapter'

/** 教学取 m=1、k_B=1 的三维麦克斯韦速率分布 */
export function maxwellPdf(v: number, T: number): number {
  const TT = Math.max(0.05, T)
  if (v < 0) return 0
  const a = 1 / Math.sqrt(2 * Math.PI * TT)
  return 4 * Math.PI * v * v * a * a * a * Math.exp(-(v * v) / (2 * TT))
}

export function maxwellVp(T: number): number {
  return Math.sqrt(2 * Math.max(0.05, T))
}

export function maxwellVavg(T: number): number {
  return Math.sqrt((8 * Math.max(0.05, T)) / Math.PI)
}

export function maxwellVrms(T: number): number {
  return Math.sqrt(3 * Math.max(0.05, T))
}

/** Box–Muller → 三维速度模长 */
function sampleSpeed(T: number): number {
  const s = Math.sqrt(Math.max(0.05, T))
  const u1 = Math.random() || 1e-12
  const u2 = Math.random()
  const u3 = Math.random() || 1e-12
  const u4 = Math.random()
  const g1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  const g2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4)
  const g3 = Math.sqrt(-2 * Math.log(Math.random() || 1e-12)) * Math.cos(2 * Math.PI * Math.random())
  return s * Math.sqrt(g1 * g1 + g2 * g2 + g3 * g3)
}

const NBINS = 40
const CURVE_N = 120

/**
 * 麦克斯韦速率分布：播放期间累计抽样直方图，叠解析曲线。
 */
export function createMaxwellModel(): PhysicsModel {
  let T = 1.2
  let nSample = 400
  let t = 0
  const period = 10
  let bins = new Float32Array(NBINS)
  let total = 0
  let vMaxPlot = 6

  function resetHist() {
    bins = new Float32Array(NBINS)
    total = 0
    vMaxPlot = Math.max(6, maxwellVrms(T) * 3.2)
  }

  function accumulate(count: number) {
    for (let i = 0; i < count; i++) {
      const v = sampleSpeed(T)
      if (v < 0 || v >= vMaxPlot) continue
      const idx = Math.min(NBINS - 1, Math.floor((v / vMaxPlot) * NBINS))
      bins[idx]! += 1
      total += 1
    }
  }

  return {
    init(params: ParamValues) {
      T = Number(params.T ?? 1.2)
      nSample = Math.max(50, Math.round(Number(params.nSample ?? 400)))
      t = 0
      resetHist()
      accumulate(Math.min(80, nSample))
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
      const rate = 40 + nSample * 0.08
      accumulate(Math.max(1, Math.round(rate * dt)))
    },
    seek(time: number) {
      const target = Math.min(period, Math.max(0, time))
      if (target < t - 1e-6) {
        t = 0
        resetHist()
        accumulate(Math.min(80, nSample))
      }
      const dt = target - t
      if (dt > 1e-9) {
        const rate = 40 + nSample * 0.08
        accumulate(Math.max(1, Math.round(rate * dt)))
        t = target
      }
    },
    observe(): ObserveSnapshot {
      const vp = maxwellVp(T)
      const vavg = maxwellVavg(T)
      const vrms = maxwellVrms(T)
      const hist = new Float32Array(NBINS)
      const binW = vMaxPlot / NBINS
      const densScale = total > 0 ? 1 / (total * binW) : 0
      for (let i = 0; i < NBINS; i++) hist[i] = bins[i]! * densScale

      const curveV = new Float32Array(CURVE_N)
      const curveF = new Float32Array(CURVE_N)
      for (let i = 0; i < CURVE_N; i++) {
        const v = (vMaxPlot * i) / (CURVE_N - 1)
        curveV[i] = v
        curveF[i] = maxwellPdf(v, T)
      }

      let fMax = 0.01
      for (let i = 0; i < CURVE_N; i++) fMax = Math.max(fMax, curveF[i]!)
      for (let i = 0; i < NBINS; i++) fMax = Math.max(fMax, hist[i]!)

      return {
        time: t,
        values: {
          T,
          nSample,
          vp,
          vavg,
          vrms,
          total,
          nBins: NBINS,
          vMaxPlot,
          fMax,
          hist,
          curveV,
          curveF,
          nCurve: CURVE_N,
          period,
          tMax: period,
          world: 6,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
      resetHist()
      accumulate(Math.min(80, nSample))
    },
    setParams(params) {
      let dirty = false
      if (params.T !== undefined) {
        T = Number(params.T)
        dirty = true
      }
      if (params.nSample !== undefined) {
        nSample = Math.max(50, Math.round(Number(params.nSample)))
      }
      if (dirty) {
        resetHist()
        accumulate(Math.min(80, nSample))
      }
    },
  }
}

export const maxwellMeta: DemoMeta = {
  id: 'thermo-maxwell',
  subject: '热学',
  category: '分子动理论',
  tags: ['麦克斯韦', '速率分布', '温度'],
  model: 'maxwell',
  adapter: 'maxwell',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'T',
      label: '温度 T',
      kind: 'number',
      default: 1.2,
      min: 0.4,
      max: 3,
      step: 0.1,
      unit: '',
    },
    {
      key: 'nSample',
      label: '目标抽样数',
      kind: 'number',
      default: 400,
      min: 100,
      max: 2000,
      step: 50,
      unit: '',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'f(v)' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '特征速',
      chartKey: 'vp',
      charts: [
        {
          id: 'speeds',
          title: '特征速率随时间',
          xLabel: 't (s)',
          leftLabel: 'v',
          series: [
            { key: 'vp', label: 'vp', color: '#f472b6', unit: '' },
            { key: 'vavg', label: '⟨v⟩', color: '#38bdf8', unit: '' },
            { key: 'vrms', label: 'vrms', color: '#4ade80', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'T', label: 'T', unit: '', tone: 'amber' },
    { key: 'vp', label: 'vp', unit: '', tone: 'purple' },
    { key: 'vavg', label: '⟨v⟩', unit: '', tone: 'blue' },
    { key: 'vrms', label: 'vrms', unit: '', tone: 'green' },
    { key: 'total', label: '样本', unit: '', tone: 'slate' },
  ],
  docs: {
    title: '麦克斯韦速率分布',
    summary:
      '三维理想气体速率概率密度。调节 T，观察曲线展宽与 vp、⟨v⟩、vrms 的相对位置；播放累计直方图逼近解析曲线。',
    concept: [
      'f(v)dv 表示速率落在 [v,v+dv] 的概率',
      '最概然速率 vp 是 f(v) 的峰值位置；⟨v⟩ 与 vrms 依次更大',
      '升高 T 使曲线右移并展宽，峰值下降',
    ],
    objectives: [
      '辨认 vp < ⟨v⟩ < vrms 的顺序',
      '验证 vp=√(2kT/m)（教学 m=k=1）',
      '观察直方图随抽样收敛到解析曲线',
    ],
    formulas: [
      'f(v)=4\\pi v^2\\left(\\frac{m}{2\\pi kT}\\right)^{3/2}e^{-mv^2/2kT}',
      'v_p=\\sqrt{2kT/m}',
      '\\langle v\\rangle=\\sqrt{8kT/\\pi m}',
      'v_{\\mathrm{rms}}=\\sqrt{3kT/m}',
    ],
    insight: '教学取 m=1、k_B=1。粉/青/绿竖线分别为 vp、⟨v⟩、vrms；金线为解析 f(v)，柱为抽样直方图。',
    legend: [
      { color: '#fbbf24', label: '解析 f(v)' },
      { color: '#64748b', label: '直方图' },
      { color: '#f472b6', label: 'vp' },
      { color: '#38bdf8', label: '⟨v⟩' },
      { color: '#4ade80', label: 'vrms' },
    ],
    steps: [
      {
        id: 'peak',
        title: '最概然速率',
        body: '峰值对应 vp；升高 T 则 vp 增大。',
        formulas: ['v_p=\\sqrt{2T}'],
        bindings: [
          { labelTex: 'T', valueKey: 'T', unit: '' },
          { labelTex: 'v_p', valueKey: 'vp', unit: '' },
        ],
      },
      {
        id: 'order',
        title: '三种特征速',
        body: '同一温度下始终有 vp < ⟨v⟩ < vrms。',
        formulas: ['v_p<\\langle v\\rangle<v_{\\mathrm{rms}}'],
        bindings: [
          { labelTex: 'v_p', valueKey: 'vp', unit: '' },
          { labelTex: '\\langle v\\rangle', valueKey: 'vavg', unit: '' },
          { labelTex: 'v_{\\mathrm{rms}}', valueKey: 'vrms', unit: '' },
        ],
      },
      {
        id: 'hist',
        title: '抽样收敛',
        body: '播放累加样本；样本越多柱状越贴近金线。',
        formulas: ['N_{\\mathrm{sample}}'],
        bindings: [{ labelTex: 'N', valueKey: 'total', unit: '' }],
        highlightOn: 'scrub',
      },
    ],
    challenges: [
      {
        id: 'order-check',
        prompt: '取 T=1.2，确认 vrms − vp ≈ 0.66。',
        hint: '√3T − √(2T) ≈ 1.897−1.549。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'T', target: 1.2, tol: 0.15 },
            { kind: 'valueNear', key: 'vrms', target: Math.sqrt(3 * 1.2), tol: 0.08 },
          ],
        },
      },
      {
        id: 'hotter',
        prompt: '把 T 调到约 2.5，使 vp ≈ 2.24。',
        hint: 'vp=√(2T)。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'T', target: 2.5, tol: 0.2 },
            { kind: 'valueNear', key: 'vp', target: Math.sqrt(5), tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerMaxwellDemo(): void {
  registerDemoBundle({
    meta: maxwellMeta,
    model: createMaxwellModel,
    adapter: createMaxwellAdapter,
  })
}
