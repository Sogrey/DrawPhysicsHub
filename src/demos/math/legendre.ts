import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createLegendreAdapter } from './legendreAdapter'

/** 勒让德 P_l(x)，l≤4 */
export function legendreP(l: number, x: number): number {
  const xx = Math.max(-1, Math.min(1, x))
  if (l <= 0) return 1
  if (l === 1) return xx
  if (l === 2) return 0.5 * (3 * xx * xx - 1)
  if (l === 3) return 0.5 * (5 * xx * xx * xx - 3 * xx)
  return 0.125 * (35 * xx * xx * xx * xx - 30 * xx * xx + 3)
}

export function createLegendreModel(): PhysicsModel {
  let l = 2
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      l = Math.round(Number(p.l ?? 2))
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const ll = Math.min(4, Math.max(0, l))
      const path: number[][] = []
      for (let i = 0; i <= 80; i++) {
        const x = -1 + (2 * i) / 80
        path.push([x, legendreP(ll, x)])
      }
      const xMark = -1 + (2 * t) / period
      return {
        time: t,
        values: {
          l: ll,
          xMark,
          P: legendreP(ll, xMark),
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
      if (p.l !== undefined) l = Math.round(Number(p.l))
    },
  }
}

export const legendreMeta: DemoMeta = {
  id: 'math-legendre',
  subject: '数理方法',
  category: '特殊函数',
  tags: ['勒让德', '多极'],
  model: 'legendre',
  adapter: 'legendre',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [{ key: 'l', label: '阶 l', kind: 'number', default: 2, min: 0, max: 4, step: 1, unit: '' }],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'Pₗ' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'P',
      chartKey: 'P',
      charts: [{ id: 'p', title: 'Pₗ(x)', xLabel: 't', leftLabel: 'P', series: [{ key: 'P', label: 'P', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'l', label: 'l', unit: '', tone: 'slate' },
    { key: 'P', label: 'P', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '勒让德多项式示意',
    summary: 'Pₗ(x) 在 [-1,1] 上正交，出现于轴对称拉普拉斯方程与多极展开。',
    concept: ['正交多项式', '多极', '关联勒让德前奏'],
    objectives: ['切换 l', '数零点', '播放扫 x'],
    formulas: ['P_0=1', 'P_2=\\tfrac12(3x^2-1)'],
    insight: '金曲线=Pₗ；粉点=当前 x。',
    legend: [{ color: '#fbbf24', label: 'Pₗ' }],
    steps: [{ id: 'l2', title: '四极', body: '取 l=2。', formulas: ['P_2'], bindings: [{ labelTex: 'P', valueKey: 'P', unit: '' }] }],
    challenges: [{ id: 'l4', prompt: '取 l=4。', hint: '调阶数。', check: { kind: 'paramNear', key: 'l', target: 4, tol: 0.5 } }],
  },
}

export function registerLegendreDemo() {
  registerDemoBundle({ meta: legendreMeta, model: createLegendreModel, adapter: createLegendreAdapter })
}
