import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createConductionAdapter } from './conductionAdapter'

export function createConductionModel(): PhysicsModel {
  let kappa = 1.2
  let t = 0
  const period = 8
  const N = 24
  let T: number[] = []

  function initProfile() {
    T = Array.from({ length: N + 1 }, (_, i) => (i === 0 ? 1 : i === N ? 0 : 0.1))
  }

  /** 显式扩散，按 CFL 自动切子步：α=κΔt/Δx² ≤ 0.4 */
  function diffuse(dt: number) {
    const dx2 = 1 / (N * N)
    const maxDt = (0.4 * dx2) / Math.max(1e-9, kappa)
    let left = dt
    while (left > 1e-15) {
      const h = Math.min(left, maxDt)
      const a = (kappa * h) / dx2
      const Tn = T.slice()
      for (let i = 1; i < N; i++) {
        Tn[i] = T[i]! + a * (T[i - 1]! - 2 * T[i]! + T[i + 1]!)
      }
      Tn[0] = 1
      Tn[N] = 0
      T = Tn
      left -= h
    }
  }

  return {
    init(p: ParamValues) {
      kappa = Number(p.kappa ?? 1.2)
      t = 0
      initProfile()
    },
    step(dt) {
      const span = Math.min(dt, period - t)
      if (span <= 0) return
      diffuse(span)
      t = Math.min(period, t + span)
    },
    seek(time) {
      t = 0
      initProfile()
      const target = Math.min(period, Math.max(0, time))
      while (t < target - 1e-12) {
        const s = Math.min(0.05, target - t)
        diffuse(s)
        t += s
      }
    },
    observe() {
      const path = T.map((v, i) => [i / N, v])
      const flux = kappa * (T[0]! - T[1]!) * N
      const mid = T[Math.floor(N / 2)] ?? 0
      return {
        time: t,
        values: {
          kappa,
          flux,
          Tmid: Number.isFinite(mid) ? mid : 0,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path },
      }
    },
    reset() {
      t = 0
      initProfile()
    },
    setParams(p) {
      if (p.kappa !== undefined) kappa = Number(p.kappa)
    },
  }
}

export const conductionMeta: DemoMeta = {
  id: 'thermo-conduction',
  subject: '热学',
  category: '输运现象',
  tags: ['热传导', '温度梯度'],
  model: 'conduction',
  adapter: 'conduction',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'kappa', label: '扩散率 κ', kind: 'number', default: 1.2, min: 0.3, max: 2.5, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '温度' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'T',
      chartKey: 'Tmid',
      charts: [
        {
          id: 'tm',
          title: '中点温度',
          xLabel: 't',
          leftLabel: 'T',
          series: [
            { key: 'Tmid', label: 'T_mid', color: '#fbbf24', unit: '' },
            { key: 'flux', label: '通量', color: '#f472b6', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'Tmid', label: 'T中', unit: '', tone: 'amber' },
    { key: 'flux', label: '通量', unit: '', tone: 'pink' },
    { key: 'kappa', label: 'κ', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '一维热传导示意',
    summary: '两端定温，杆内温度向线性稳态扩散。κ 越大弛豫越快。',
    concept: ['傅里叶定律', '扩散方程', '稳态线性剖面'],
    objectives: ['观察剖面演化', '提高 κ', '读中点温度'],
    formulas: ['\\partial_t T=\\kappa\\partial_{xx}T'],
    insight: '色条=温度剖面；左热右冷。',
    legend: [
      { color: '#f87171', label: '热端' },
      { color: '#38bdf8', label: '冷端' },
    ],
    steps: [
      {
        id: 'steady',
        title: '趋稳',
        body: '播放至中点接近 0.5。',
        formulas: ['T\\to 1-x'],
        bindings: [{ labelTex: 'T', valueKey: 'Tmid', unit: '' }],
      },
    ],
    challenges: [
      {
        id: 'mid',
        prompt: '播放使 T_mid 接近 0.5。',
        hint: '等一会儿。',
        check: { kind: 'valueNear', key: 'Tmid', target: 0.5, tol: 0.2 },
      },
    ],
  },
}

export function registerConductionDemo() {
  registerDemoBundle({
    meta: conductionMeta,
    model: createConductionModel,
    adapter: createConductionAdapter,
  })
}
