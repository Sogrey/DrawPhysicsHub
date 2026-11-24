import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createFourierAdapter } from './fourierAdapter'

/** 方波傅里叶：f≈(4/π) Σ_{k=1,3,…}^{N} sin(kx)/k */
export function squarePartial(x: number, nTerms: number): number {
  let s = 0
  const n = Math.max(1, Math.floor(nTerms))
  for (let k = 1; k <= n; k += 2) {
    s += Math.sin(k * x) / k
  }
  return (4 / Math.PI) * s
}

export function createFourierModel(): PhysicsModel {
  let nTerms = 5
  let t = 0
  const period = 10
  const N = 160
  const X_MAX = 2 * Math.PI

  return {
    init(params: ParamValues) {
      nTerms = Number(params.nTerms ?? 5)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      // 播放：谐波数 1 → 25
      const nLive = t <= 1e-9 ? nTerms : Math.max(1, Math.round(1 + (24 * t) / period))
      const nOdd = nLive % 2 === 0 ? nLive - 1 : nLive
      const path: number[][] = []
      const target: number[][] = []
      for (let i = 0; i <= N; i++) {
        const x = (X_MAX * i) / N
        path.push([x, squarePartial(x, nOdd)])
        const sq = x % (2 * Math.PI) < Math.PI ? 1 : -1
        target.push([x, sq])
      }
      const err = Math.abs(squarePartial(Math.PI / 2, nOdd) - 1)
      return {
        time: t,
        values: {
          nTerms: nOdd,
          nParam: nTerms,
          err,
          gibbs: nOdd >= 9 ? 1 : 0,
          period,
          tMax: period,
          xMax: X_MAX,
          world: 4,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path, target },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.nTerms !== undefined) nTerms = Number(params.nTerms)
    },
  }
}

export const fourierMeta: DemoMeta = {
  id: 'math-fourier',
  subject: '数理方法',
  category: '傅里叶分析',
  tags: ['傅里叶', '谐波', 'Gibbs'],
  model: 'fourier',
  adapter: 'fourier',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'nTerms', label: '谐波数 N（初）', kind: 'number', default: 5, min: 1, max: 25, step: 2, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '波形' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '误差',
      chartKey: 'err',
      charts: [
        {
          id: 'err',
          title: '中点误差',
          xLabel: 't (s)',
          leftLabel: 'ε',
          series: [
            { key: 'err', label: '|S_N−1|', color: '#fbbf24', unit: '' },
            { key: 'nTerms', label: 'N', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'nTerms', label: 'N', unit: '', tone: 'purple' },
    { key: 'err', label: 'ε', unit: '', tone: 'amber' },
    { key: 'gibbs', label: 'Gibbs', unit: '', tone: 'pink' },
  ],
  docs: {
    title: '傅里叶级数波形重建',
    summary:
      '方波用奇次谐波叠加重建。N↑ 逼近更好，但间断点附近出现 Gibbs 振铃。播放扫 N。',
    concept: [
      '方波 = Σ 奇次正弦 / k',
      '部分和 S_N 在间断处过冲（Gibbs）',
      '均方意义收敛，点态在间断处到中值',
    ],
    objectives: ['观察 N 增大时波形趋近', '识别 Gibbs 过冲', '理解谐波叠加'],
    formulas: ['f\\approx\\frac{4}{\\pi}\\sum_{k\\,\\mathrm{odd}}\\frac{\\sin(kx)}{k}'],
    insight: '灰=目标方波；青=部分和。N 大时间断附近振铃更密。',
    legend: [
      { color: '#94a3b8', label: '方波' },
      { color: '#38bdf8', label: 'S_N' },
    ],
    steps: [
      {
        id: 'gibbs',
        title: 'Gibbs',
        body: '扫到 N≥9，看间断处过冲。',
        formulas: ['\\text{Gibbs}\\sim 9\\%'],
        bindings: [
          { labelTex: 'N', valueKey: 'nTerms', unit: '' },
          { labelTex: '\\varepsilon', valueKey: 'err', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'hiN',
        prompt: '播放使 N≥15。',
        hint: '拖到后半段。',
        check: { kind: 'valueNear', key: 'nTerms', target: 17, tol: 8 },
      },
    ],
  },
}

export function registerFourierDemo(): void {
  registerDemoBundle({
    meta: fourierMeta,
    model: createFourierModel,
    adapter: createFourierAdapter,
  })
}
