import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createLcAdapter } from './lcAdapter'

/** ω₀ = 1/√(LC) */
export function lcOmega0(L: number, C: number): number {
  return 1 / Math.sqrt(Math.max(1e-9, L * C))
}

export function createLcModel(): PhysicsModel {
  let L = 1
  let C = 0.5
  let t = 0
  const period = 10

  return {
    init(p: ParamValues) {
      L = Number(p.L ?? 1)
      C = Number(p.C ?? 0.5)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const w0 = lcOmega0(L, C)
      const q = Math.cos(w0 * t)
      const i = -w0 * Math.sin(w0 * t)
      const UC = (q * q) / (2 * Math.max(1e-9, C))
      const UL = 0.5 * L * i * i
      const path: number[][] = []
      for (let k = 0; k <= 80; k++) {
        const tt = (period * k) / 80
        path.push([Math.cos(w0 * tt), -w0 * Math.sin(w0 * tt)])
      }
      return {
        time: t,
        values: {
          L,
          C,
          w0,
          q,
          i,
          UC,
          UL,
          E: UC + UL,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.L !== undefined) L = Number(p.L)
      if (p.C !== undefined) C = Number(p.C)
    },
  }
}

export const lcMeta: DemoMeta = {
  id: 'em-lc',
  subject: '电磁学',
  category: '交流电路',
  tags: ['LC', '振荡'],
  model: 'lc',
  adapter: 'lc',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'L', label: 'L', kind: 'number', default: 1, min: 0.4, max: 2, step: 0.1, unit: '' },
    { key: 'C', label: 'C', kind: 'number', default: 0.5, min: 0.2, max: 1.5, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'LC' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: '能量',
      chartKey: 'UC',
      charts: [
        {
          id: 'e',
          title: '电容/电感能量',
          xLabel: 't',
          leftLabel: 'U',
          series: [
            { key: 'UC', label: 'UC', color: '#38bdf8', unit: '' },
            { key: 'UL', label: 'UL', color: '#fbbf24', unit: '' },
            { key: 'E', label: 'E', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'w0', label: 'ω₀', unit: '', tone: 'slate' },
    { key: 'q', label: 'q', unit: '', tone: 'blue' },
    { key: 'i', label: 'i', unit: '', tone: 'amber' },
  ],
  docs: {
    title: 'LC 电磁振荡',
    summary: '理想 LC：ω₀=1/√(LC)。电荷与电流正弦交替，电能⇔磁能。',
    concept: ['固有频率', '能量互换', '相平面'],
    objectives: ['调 L、C 看周期', '对照 UC↔UL', '观察 (q,i) 椭圆'],
    formulas: ['\\omega_0=1/\\sqrt{LC}', 'q=q_0\\cos\\omega_0 t'],
    insight: '左=电路示意；右=(q,i) 相轨。',
    legend: [
      { color: '#38bdf8', label: '电容能' },
      { color: '#fbbf24', label: '电感能' },
    ],
    steps: [
      {
        id: 'swap',
        title: '能量互换',
        body: '播放看 UC 与 UL 此消彼长。',
        formulas: ['U_C+U_L'],
        bindings: [
          { labelTex: 'U_C', valueKey: 'UC', unit: '' },
          { labelTex: 'U_L', valueKey: 'UL', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'slow',
        prompt: '增大 L 或 C 使 ω₀ 变小。',
        hint: '调大 L。',
        check: { kind: 'paramNear', key: 'L', target: 1.8, tol: 0.4 },
      },
    ],
  },
}

export function registerLcDemo() {
  registerDemoBundle({ meta: lcMeta, model: createLcModel, adapter: createLcAdapter })
}
