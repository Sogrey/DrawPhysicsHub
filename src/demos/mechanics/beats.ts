import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createBeatsAdapter } from './beatsAdapter'

/** 拍：y=A[cos(ω1 t)+cos(ω2 t)] = 2A cos(ωb t) cos(ωc t) */
export function beatEnvelope(A: number, w1: number, w2: number, t: number) {
  const wb = Math.abs(w1 - w2) / 2
  const wc = (w1 + w2) / 2
  const y = A * (Math.cos(w1 * t) + Math.cos(w2 * t))
  const env = 2 * A * Math.abs(Math.cos(wb * t))
  return { y, env, wb, wc, Tbeat: Math.PI / Math.max(1e-6, wb) }
}

export function createBeatsModel(): PhysicsModel {
  let f1 = 2.0
  let f2 = 2.3
  let A = 1
  let t = 0
  const period = 12
  const N = 200

  return {
    init(params: ParamValues) {
      f1 = Number(params.f1 ?? 2)
      f2 = Number(params.f2 ?? 2.3)
      A = Number(params.A ?? 1)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const w1 = 2 * Math.PI * f1
      const w2 = 2 * Math.PI * f2
      const b = beatEnvelope(A, w1, w2, t)
      const path: number[][] = []
      const env: number[][] = []
      for (let i = 0; i <= N; i++) {
        const ti = (period * i) / N
        const bi = beatEnvelope(A, w1, w2, ti)
        path.push([ti, bi.y])
        env.push([ti, bi.env], [ti, -bi.env])
      }
      return {
        time: t,
        values: {
          f1,
          f2,
          A,
          y: b.y,
          env: b.env,
          df: Math.abs(f1 - f2),
          Tbeat: b.Tbeat,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path, env },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.f1 !== undefined) f1 = Number(params.f1)
      if (params.f2 !== undefined) f2 = Number(params.f2)
      if (params.A !== undefined) A = Number(params.A)
    },
  }
}

export const beatsMeta: DemoMeta = {
  id: 'mech-beats',
  subject: '力学',
  category: '振动',
  tags: ['拍', '近频'],
  model: 'beats',
  adapter: 'beats',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'f1', label: 'f₁', kind: 'number', default: 2, min: 1.5, max: 3, step: 0.05, unit: 'Hz' },
    { key: 'f2', label: 'f₂', kind: 'number', default: 2.3, min: 1.5, max: 3.5, step: 0.05, unit: 'Hz' },
    { key: 'A', label: '振幅', kind: 'number', default: 1, min: 0.4, max: 1.5, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '波形' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'y',
      chartKey: 'y',
      charts: [
        {
          id: 'y',
          title: '合成',
          xLabel: 't',
          leftLabel: 'y',
          series: [
            { key: 'y', label: 'y', color: '#38bdf8', unit: '' },
            { key: 'env', label: '包络', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'df', label: '|Δf|', unit: 'Hz', tone: 'amber' },
    { key: 'Tbeat', label: 'T_拍', unit: 's', tone: 'purple' },
    { key: 'env', label: '包络', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '拍现象',
    summary: '两近频简谐叠加：快振荡被慢包络调制。拍频 |f₁−f₂|，拍周期 1/|Δf|。',
    concept: ['拍频 = |f₁−f₂|', '包络周期 1/|Δf|', 'Δf→0 包络变慢'],
    objectives: ['观察强弱交替', '验证 T_拍≈1/|Δf|', '减小频差拉长拍'],
    formulas: ['y=A(\\cos\\omega_1 t+\\cos\\omega_2 t)', 'f_{\\mathrm{beat}}=|f_1-f_2|'],
    insight: '青=合成波；金虚线=包络。',
    legend: [
      { color: '#38bdf8', label: '合成' },
      { color: '#fbbf24', label: '包络' },
    ],
    steps: [
      {
        id: 'period',
        title: '拍周期',
        body: '对照读数 T_拍 与 1/|Δf|。',
        formulas: ['T=1/|\\Delta f|'],
        bindings: [
          { labelTex: 'T', valueKey: 'Tbeat', unit: 's' },
          { labelTex: '\\Delta f', valueKey: 'df', unit: 'Hz' },
        ],
      },
    ],
    challenges: [
      {
        id: 'slow',
        prompt: '使 |Δf|≈0.15 Hz。',
        hint: '让两频率更接近。',
        check: { kind: 'valueNear', key: 'df', target: 0.15, tol: 0.12 },
      },
    ],
  },
}

export function registerBeatsDemo(): void {
  registerDemoBundle({
    meta: beatsMeta,
    model: createBeatsModel,
    adapter: createBeatsAdapter,
  })
}
