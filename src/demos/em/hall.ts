import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createHallAdapter } from './hallAdapter'

/** 霍尔电压 VH = I B /(n e t) 教学简化：VH ∝ I B / n */
export function hallVoltage(I: number, B: number, n: number): number {
  return (I * B) / Math.max(1e-6, n)
}

export function createHallModel(): PhysicsModel {
  let I = 1.2
  let B = 1
  let n = 1
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      I = Number(p.I ?? 1.2)
      B = Number(p.B ?? 1)
      n = Number(p.n ?? 1)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const VH = hallVoltage(I, B, n)
      const u = t / period
      // 载流子沿 +x，洛伦兹偏转向 ±y（符号示意）
      const drift = -1.5 + 3 * u
      const defl = 0.55 * Math.sign(B) * Math.min(1, Math.abs(VH))
      return {
        time: t,
        values: {
          I,
          B,
          n,
          VH,
          drift,
          defl,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.I !== undefined) I = Number(p.I)
      if (p.B !== undefined) B = Number(p.B)
      if (p.n !== undefined) n = Number(p.n)
    },
  }
}

export const hallMeta: DemoMeta = {
  id: 'em-hall',
  subject: '电磁学',
  category: '洛伦兹力',
  tags: ['霍尔', '载流子'],
  model: 'hall',
  adapter: 'hall',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'I', label: '电流 I', kind: 'number', default: 1.2, min: 0.3, max: 2.5, step: 0.1, unit: '' },
    { key: 'B', label: '磁场 B', kind: 'number', default: 1, min: -2, max: 2, step: 0.1, unit: '' },
    { key: 'n', label: '载流子密度 n', kind: 'number', default: 1, min: 0.4, max: 2, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '霍尔' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'VH',
      chartKey: 'VH',
      charts: [
        {
          id: 'vh',
          title: '霍尔电压',
          xLabel: 't',
          leftLabel: 'VH',
          series: [{ key: 'VH', label: 'VH', color: '#fbbf24', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'I', label: 'I', unit: '', tone: 'blue' },
    { key: 'B', label: 'B', unit: '', tone: 'slate' },
    { key: 'VH', label: 'VH', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '霍尔效应示意',
    summary: '载流子在 B 中偏转，两侧堆积形成 VH∝IB/n。反转 B 改变偏转方向。',
    concept: ['洛伦兹力', '霍尔电压', '载流子'],
    objectives: ['调 I、B 看 VH', '反转 B', '增大 n 减弱 VH'],
    formulas: ['V_H \\propto IB/n'],
    insight: '金点=载流子；两侧电极示意电位差。',
    legend: [
      { color: '#fbbf24', label: '载流子' },
      { color: '#a78bfa', label: 'B' },
      { color: '#38bdf8', label: '电流' },
    ],
    steps: [
      {
        id: 'B',
        title: '磁场',
        body: '增大 |B| 观察 VH。',
        formulas: ['V_H'],
        bindings: [
          { labelTex: 'V_H', valueKey: 'VH', unit: '' },
          { labelTex: 'B', valueKey: 'B', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'flip',
        prompt: '取 B 为负，观察偏转反向。',
        hint: '将 B 调到负值。',
        check: { kind: 'paramNear', key: 'B', target: -1, tol: 0.6 },
      },
    ],
  },
}

export function registerHallDemo() {
  registerDemoBundle({ meta: hallMeta, model: createHallModel, adapter: createHallAdapter })
}
