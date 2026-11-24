import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createLatticeDiAdapter } from './latticeDiAdapter'

/**
 * 一维双原子链（等 κ，质量 M>m）：
 * ω² = κ(1/m+1/M) ± κ √[(1/m+1/M)² − 4 sin²(ka)/(m M)]
 */
export function diatomicBranches(
  k: number,
  a: number,
  kappa: number,
  m: number,
  M: number,
): { wAc: number; wOp: number } {
  const s2 = Math.sin(k * a) ** 2
  const A = kappa * (1 / m + 1 / M)
  const disc = Math.max(0, A * A - (4 * kappa * kappa * s2) / (m * M))
  const root = Math.sqrt(disc)
  return { wAc: Math.sqrt(Math.max(0, A - root)), wOp: Math.sqrt(Math.max(0, A + root)) }
}

export function createLatticeDiModel(): PhysicsModel {
  let kappa = 1
  let m = 0.7
  let M = 1.4
  let a = 1
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      kappa = Number(params.kappa ?? 1)
      m = Number(params.m ?? 0.7)
      M = Number(params.M ?? 1.4)
      a = Number(params.a ?? 1)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const kMax = Math.PI / a
      const k = (kMax * t) / period
      const br = diatomicBranches(k, a, kappa, m, M)
      const ac: number[][] = []
      const op: number[][] = []
      for (let i = 0; i <= 50; i++) {
        const kk = (kMax * i) / 50
        const b = diatomicBranches(kk, a, kappa, m, M)
        ac.push([kk, b.wAc])
        op.push([kk, b.wOp])
      }
      // two-atom motif animation (optical vs acoustic mix)
      const atoms: number[][] = []
      for (let n = 0; n < 10; n++) {
        const xA = 2 * n * a
        const xB = xA + a
        const phase = k * (2 * n * a) - br.wOp * t
        const uA = 0.25 * Math.cos(phase)
        const uB = -0.25 * Math.cos(phase) // optical: opposite
        atoms.push([xA + uA, 0.3], [xB + uB, -0.15])
      }
      const gap = br.wOp - br.wAc
      return {
        time: t,
        values: {
          kappa,
          m,
          M,
          a,
          k,
          wAc: br.wAc,
          wOp: br.wOp,
          gap,
          kMax,
          period,
          tMax: period,
          world: 12,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: atoms, ac, op },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.kappa !== undefined) kappa = Number(params.kappa)
      if (params.m !== undefined) m = Number(params.m)
      if (params.M !== undefined) M = Number(params.M)
      if (params.a !== undefined) a = Number(params.a)
    },
  }
}

export const latticeDiMeta: DemoMeta = {
  id: 'lattice-di',
  subject: '数理方法',
  category: '晶格振动',
  tags: ['双原子链', '光学支'],
  model: 'latticeDi',
  adapter: 'latticeDi',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'kappa', label: 'κ', kind: 'number', default: 1, min: 0.4, max: 2, step: 0.1, unit: '' },
    { key: 'm', label: '轻质量 m', kind: 'number', default: 0.7, min: 0.4, max: 1.2, step: 0.1, unit: '' },
    { key: 'M', label: '重质量 M', kind: 'number', default: 1.4, min: 0.8, max: 2.2, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '双支' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '支',
      chartKey: 'wOp',
      charts: [
        {
          id: 'br',
          title: '声学 / 光学',
          xLabel: 't (s)',
          leftLabel: 'ω',
          series: [
            { key: 'wAc', label: '声学', color: '#38bdf8', unit: '' },
            { key: 'wOp', label: '光学', color: '#f472b6', unit: '' },
            { key: 'gap', label: '能隙', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'wAc', label: 'ω_ac', unit: '', tone: 'blue' },
    { key: 'wOp', label: 'ω_op', unit: '', tone: 'pink' },
    { key: 'gap', label: '间隙', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '双原子链光学支 / 声学支',
    summary:
      '质量不等的双原子原胞：色散分声学支（同相）与光学支（反相），中间有禁带。播放扫 k，动画示意光学模反相振动。',
    concept: [
      '声学支：长波 ω→0',
      '光学支：有限频率、反相',
      '质量差 → 频率间隙',
    ],
    objectives: ['辨认两支色散', '观察光学支反相位移', '看间隙随质量比变化'],
    formulas: [
      '\\omega_\\pm^2=\\kappa\\big(\\tfrac1m+\\tfrac1M\\big)\\pm\\cdots',
    ],
    insight: '青=声学支，粉=光学支；原子青/粉分属两种质量。',
    legend: [
      { color: '#38bdf8', label: '声学 / 轻原子' },
      { color: '#f472b6', label: '光学 / 重原子' },
    ],
    steps: [
      {
        id: 'gap',
        title: '能隙',
        body: '区界附近看 ω_op−ω_ac。',
        formulas: ['\\Delta\\omega=\\omega_{\\mathrm{op}}-\\omega_{\\mathrm{ac}}'],
        bindings: [
          { labelTex: '\\Delta\\omega', valueKey: 'gap', unit: '' },
          { labelTex: 'k', valueKey: 'k', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'seeGap',
        prompt: '播放至区界附近，使 gap>0.3。',
        hint: '默认质量比即可。',
        check: { kind: 'valueNear', key: 'gap', target: 0.8, tol: 0.7 },
      },
    ],
  },
}

export function registerLatticeDiDemo(): void {
  registerDemoBundle({
    meta: latticeDiMeta,
    model: createLatticeDiModel,
    adapter: createLatticeDiAdapter,
  })
}
