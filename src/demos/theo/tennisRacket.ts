import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createTennisRacketAdapter } from './tennisRacketAdapter'

/** 中间主轴不稳：扰动指数增长示意 */
export function intermediateGrowth(eps0: number, t: number, rate: number): number {
  return eps0 * Math.cosh(rate * t)
}

export function createTennisRacketModel(): PhysicsModel {
  let axis = 2 // 1=稳 2=中间不稳 3=稳
  let eps0 = 0.08
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      axis = Math.round(Number(p.axis ?? 2))
      eps0 = Number(p.eps0 ?? 0.08)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const ax = Math.min(3, Math.max(1, axis))
      const unstable = ax === 2 ? 1 : 0
      const rate = unstable ? 0.7 : 0
      const eps = unstable ? Math.min(1.2, intermediateGrowth(eps0, t, rate)) : eps0 * Math.cos(1.5 * t)
      const ang = (2 * Math.PI * t) / period
      return {
        time: t,
        values: {
          axis: ax,
          eps0,
          eps,
          unstable,
          ang,
          flip: unstable && eps > 0.9 ? 1 : 0,
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
      if (p.axis !== undefined) axis = Math.round(Number(p.axis))
      if (p.eps0 !== undefined) eps0 = Number(p.eps0)
    },
  }
}

export const tennisRacketMeta: DemoMeta = {
  id: 'theo-tennis-racket',
  subject: '理论力学',
  category: '刚体动力学',
  tags: ['刚体自由转动', '稳定性'],
  model: 'tennisRacket',
  adapter: 'tennisRacket',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'axis', label: '自旋主轴 (1/2/3)', kind: 'number', default: 2, min: 1, max: 3, step: 1, unit: '' },
    { key: 'eps0', label: '初扰动', kind: 'number', default: 0.08, min: 0.02, max: 0.2, step: 0.02, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '网球拍' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'ε',
      chartKey: 'eps',
      charts: [{ id: 'e', title: '扰动', xLabel: 't', leftLabel: 'ε', series: [{ key: 'eps', label: 'ε', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'axis', label: '轴', unit: '', tone: 'slate' },
    { key: 'eps', label: 'ε', unit: '', tone: 'amber' },
    { key: 'flip', label: '翻转', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '网球拍定理（中间轴不稳）',
    summary: '绕最大/最小惯量主轴自旋稳定；绕中间主轴微小扰动指数增长并翻转。',
    concept: ['主惯量轴', '稳定性', 'Dzhanibekov'],
    objectives: ['切换轴 1/2/3', '轴2 看扰动暴涨', '对照稳定振荡'],
    formulas: ['\\varepsilon(t)\\sim\\varepsilon_0\\cosh(\\lambda t)\\ (中间轴)'],
    insight: '轴=2 时金扰动曲线上扬并触发翻转标记。',
    legend: [{ color: '#fbbf24', label: '扰动' }],
    steps: [{ id: 'mid', title: '中间轴', body: '取 axis=2 播放。', formulas: ['\\varepsilon'], bindings: [{ labelTex: '\\varepsilon', valueKey: 'eps', unit: '' }] }],
    challenges: [{ id: 'stable', prompt: '切换到稳定轴 axis=1。', hint: '改主轴编号。', check: { kind: 'paramNear', key: 'axis', target: 1, tol: 0.5 } }],
  },
}

export function registerTennisRacketDemo() {
  registerDemoBundle({
    meta: tennisRacketMeta,
    model: createTennisRacketModel,
    adapter: createTennisRacketAdapter,
  })
}
