import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createVariationalAdapter } from './variationalAdapter'

/** 谐振子变分：试用 ψ∝e^{-α x²/2}，E(α)=α/4 + 1/(4α)（ℏ=m=ω=1）→ 最小 α=1, E=1/2 */
export function variationalEnergy(alpha: number): number {
  const a = Math.max(1e-4, alpha)
  return a / 4 + 1 / (4 * a)
}

export function createVariationalModel(): PhysicsModel {
  let alpha = 0.5
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      alpha = Number(p.alpha ?? 0.5)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      // 播放扫 α
      const aLive = t < 1e-9 ? alpha : 0.2 + (2.5 * t) / period
      const E = variationalEnergy(aLive)
      const Emin = 0.5
      const path: number[][] = []
      for (let i = 0; i <= 80; i++) {
        const a = 0.2 + (2.5 * i) / 80
        path.push([a, variationalEnergy(a)])
      }
      return {
        time: t,
        values: {
          alpha: aLive,
          alpha0: alpha,
          E,
          Emin,
          err: E - Emin,
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
      if (p.alpha !== undefined) alpha = Number(p.alpha)
    },
  }
}

export const variationalMeta: DemoMeta = {
  id: 'qm-variational',
  subject: '量子力学',
  category: '多体与近似',
  tags: ['变分法', '基态'],
  model: 'variational',
  adapter: 'variational',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [{ key: 'alpha', label: '初 α', kind: 'number', default: 0.5, min: 0.2, max: 2.5, step: 0.1, unit: '' }],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '变分' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'E',
      chartKey: 'E',
      charts: [{ id: 'e', title: '试探能量', xLabel: 't', leftLabel: 'E', series: [{ key: 'E', label: 'E(α)', color: '#fbbf24', unit: '' }, { key: 'err', label: 'E−E₀', color: '#a78bfa', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'alpha', label: 'α', unit: '', tone: 'slate' },
    { key: 'E', label: 'E', unit: '', tone: 'amber' },
    { key: 'err', label: 'ΔE', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '变分法基态估计示意',
    summary: '谐振子高斯试探：E(α)=α/4+1/(4α)，最小在 α=1、E=½=精确基态。',
    concept: ['变分原理', '试探函数', '能量上界'],
    objectives: ['播放扫 α', '找能量最低点', '对照 E≥E₀'],
    formulas: ['E(\\alpha)=\\tfrac{\\alpha}{4}+\\tfrac{1}{4\\alpha}', 'E\\ge E_0'],
    insight: '金曲线=E(α)；竖线≈最优点 α=1。',
    legend: [{ color: '#fbbf24', label: 'E(α)' }],
    steps: [{ id: 'min', title: '极小', body: '播放经过 α≈1。', formulas: ['E'], bindings: [{ labelTex: 'E', valueKey: 'E', unit: '' }] }],
    challenges: [{ id: 'start', prompt: '把初 α 设到约 1。', hint: '调初 α。', check: { kind: 'paramNear', key: 'alpha', target: 1, tol: 0.25 } }],
  },
}

export function registerVariationalDemo() {
  registerDemoBundle({
    meta: variationalMeta,
    model: createVariationalModel,
    adapter: createVariationalAdapter,
  })
}
