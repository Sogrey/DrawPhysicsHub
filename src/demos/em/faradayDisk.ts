import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createFaradayDiskAdapter } from './faradayDiskAdapter'

/** 法拉第圆盘：ε = ½ B ω R²（均匀 B∥轴） */
export function faradayEmf(B: number, omega: number, R: number): number {
  return 0.5 * B * omega * R * R
}

export function createFaradayDiskModel(): PhysicsModel {
  let B = 1
  let omega = 2
  let R = 1.2
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      B = Number(p.B ?? 1)
      omega = Number(p.omega ?? 2)
      R = Number(p.R ?? 1.2)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const emf = faradayEmf(B, omega, R)
      const ang = omega * t
      return {
        time: t,
        values: {
          B,
          omega,
          R,
          emf,
          ang,
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
      if (p.B !== undefined) B = Number(p.B)
      if (p.omega !== undefined) omega = Number(p.omega)
      if (p.R !== undefined) R = Number(p.R)
    },
  }
}

export const faradayDiskMeta: DemoMeta = {
  id: 'em-faraday-disk',
  subject: '电磁学',
  category: '电磁感应',
  tags: ['动生', '圆盘'],
  model: 'faradayDisk',
  adapter: 'faradayDisk',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'B', label: 'B', kind: 'number', default: 1, min: 0.3, max: 2, step: 0.1, unit: '' },
    { key: 'omega', label: 'ω', kind: 'number', default: 2, min: 0.5, max: 4, step: 0.1, unit: '' },
    { key: 'R', label: '半径 R', kind: 'number', default: 1.2, min: 0.6, max: 1.8, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '圆盘' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'ε',
      chartKey: 'emf',
      charts: [
        {
          id: 'e',
          title: '动生电动势',
          xLabel: 't',
          leftLabel: 'ε',
          series: [{ key: 'emf', label: 'ε', color: '#fbbf24', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'omega', label: 'ω', unit: '', tone: 'slate' },
    { key: 'emf', label: 'ε', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '法拉第圆盘示意',
    summary: '均匀轴向 B 中旋转导体盘：轴心到边缘 ε=½BωR²（动生电动势）。',
    concept: ['动生电动势', '洛伦兹力', '开路电压'],
    objectives: ['调 ω、B、R', '读 ε', '播放看旋转'],
    formulas: ['\\mathcal{E}=\\tfrac12 B\\omega R^2'],
    insight: '径向刷接触；金读数=ε。',
    legend: [
      { color: '#a78bfa', label: 'B' },
      { color: '#fbbf24', label: '圆盘' },
      { color: '#38bdf8', label: '电刷' },
    ],
    steps: [
      {
        id: 'spin',
        title: '转速',
        body: '增大 ω 观察 ε 正比增大。',
        formulas: ['\\mathcal{E}'],
        bindings: [
          { labelTex: '\\mathcal{E}', valueKey: 'emf', unit: '' },
          { labelTex: '\\omega', valueKey: 'omega', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'fast',
        prompt: '取 ω≥3。',
        hint: '调转速。',
        check: { kind: 'paramNear', key: 'omega', target: 3.5, tol: 0.6 },
      },
    ],
  },
}

export function registerFaradayDiskDemo() {
  registerDemoBundle({
    meta: faradayDiskMeta,
    model: createFaradayDiskModel,
    adapter: createFaradayDiskAdapter,
  })
}
