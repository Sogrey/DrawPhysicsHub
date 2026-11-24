import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createAbbeAdapter } from './abbeAdapter'

/** 阿贝极限 d ≈ λ / (2 NA) */
export function abbeLimit(lambda: number, NA: number): number {
  return lambda / (2 * Math.max(1e-6, NA))
}

export function createAbbeModel(): PhysicsModel {
  let lambda = 0.55
  let NA = 0.8
  let sep = 0.5
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      lambda = Number(p.lambda ?? 0.55)
      NA = Number(p.NA ?? 0.8)
      sep = Number(p.sep ?? 0.5)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const d = abbeLimit(lambda, NA)
      const resolved = sep > d ? 1 : 0
      // Airy-like intensity of two points
      const path: number[][] = []
      for (let i = 0; i <= 100; i++) {
        const x = -2 + (4 * i) / 100
        const s1 = (x + sep / 2) / (0.35 * d)
        const s2 = (x - sep / 2) / (0.35 * d)
        const a1 = Math.exp(-(s1 * s1))
        const a2 = Math.exp(-(s2 * s2))
        path.push([x, a1 + a2])
      }
      const blend = t / period
      return {
        time: t,
        values: {
          lambda,
          NA,
          sep,
          d,
          resolved,
          blend,
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
      if (p.lambda !== undefined) lambda = Number(p.lambda)
      if (p.NA !== undefined) NA = Number(p.NA)
      if (p.sep !== undefined) sep = Number(p.sep)
    },
  }
}

export const abbeMeta: DemoMeta = {
  id: 'opt-abbe',
  subject: '光学',
  category: '应用光学',
  tags: ['阿贝', '分辨本领'],
  model: 'abbe',
  adapter: 'abbe',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'lambda', label: 'λ', kind: 'number', default: 0.55, min: 0.4, max: 0.7, step: 0.02, unit: '' },
    { key: 'NA', label: '数值孔径 NA', kind: 'number', default: 0.8, min: 0.3, max: 1.2, step: 0.05, unit: '' },
    { key: 'sep', label: '两点间距', kind: 'number', default: 0.5, min: 0.15, max: 1.2, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '分辨' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'd',
      chartKey: 'd',
      charts: [{ id: 'd', title: '分辨极限', xLabel: 't', leftLabel: 'd', series: [{ key: 'd', label: 'd', color: '#fbbf24', unit: '' }, { key: 'sep', label: 'sep', color: '#a78bfa', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'd', label: 'd', unit: '', tone: 'amber' },
    { key: 'resolved', label: '可分辨', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '阿贝成像与分辨极限',
    summary: '显微镜分辨极限 d≈λ/(2 NA)。两点间距大于 d 时可分辨。',
    concept: ['阿贝极限', '数值孔径', '瑞利判据示意'],
    objectives: ['调 NA 看 d', '改间距跨临界', '观察双峰合并'],
    formulas: ['d\\approx\\lambda/(2\\,NA)'],
    insight: '金曲线=像面强度；竖线标极限。',
    legend: [{ color: '#fbbf24', label: '强度' }],
    steps: [{ id: 'na', title: 'NA', body: '增大 NA 减小 d。', formulas: ['d'], bindings: [{ labelTex: 'd', valueKey: 'd', unit: '' }] }],
    challenges: [{ id: 'resolve', prompt: '调节使可分辨=1。', hint: '增大间距或 NA。', check: { kind: 'paramNear', key: 'sep', target: 0.9, tol: 0.35 } }],
  },
}

export function registerAbbeDemo() {
  registerDemoBundle({ meta: abbeMeta, model: createAbbeModel, adapter: createAbbeAdapter })
}
