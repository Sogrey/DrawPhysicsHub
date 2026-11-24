import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createPhasePortraitAdapter } from './phasePortraitAdapter'

/** 范德波尔：ẍ − μ(1−x²)ẋ + x = 0 */
export function vanderPolDeriv(x: number, v: number, mu: number): { dx: number; dv: number } {
  return { dx: v, dv: mu * (1 - x * x) * v - x }
}

export function createPhasePortraitModel(): PhysicsModel {
  let mu = 1
  let t = 0
  const period = 12
  let x = 0.2
  let v = 0

  return {
    init(p: ParamValues) {
      mu = Number(p.mu ?? 1)
      x = 0.2
      v = 0
      t = 0
    },
    step(dt) {
      const h = Math.min(dt, 0.02)
      let left = Math.min(period - t, Math.max(0, dt))
      while (left > 1e-12) {
        const step = Math.min(h, left)
        // RK2
        const d1 = vanderPolDeriv(x, v, mu)
        const xm = x + d1.dx * step * 0.5
        const vm = v + d1.dv * step * 0.5
        const d2 = vanderPolDeriv(xm, vm, mu)
        x += d2.dx * step
        v += d2.dv * step
        t += step
        left -= step
      }
      t = Math.min(period, t)
    },
    seek(time) {
      // 从头积分到目标时刻
      mu = mu
      x = 0.2
      v = 0
      t = 0
      const target = Math.min(period, Math.max(0, time))
      while (t < target - 1e-12) {
        const step = Math.min(0.02, target - t)
        const d1 = vanderPolDeriv(x, v, mu)
        const xm = x + d1.dx * step * 0.5
        const vm = v + d1.dv * step * 0.5
        const d2 = vanderPolDeriv(xm, vm, mu)
        x += d2.dx * step
        v += d2.dv * step
        t += step
      }
    },
    observe() {
      const path: number[][] = []
      // 采样一段相轨（从当前参数重新短积分仅用于轨迹显示缓存太贵；用当前点+近期近似）
      let sx = 0.2
      let sv = 0
      for (let i = 0; i <= 200; i++) {
        path.push([sx, sv])
        const d1 = vanderPolDeriv(sx, sv, mu)
        const h = 0.04
        const xm = sx + d1.dx * h * 0.5
        const vm = sv + d1.dv * h * 0.5
        const d2 = vanderPolDeriv(xm, vm, mu)
        sx += d2.dx * h
        sv += d2.dv * h
      }
      const r = Math.hypot(x, v)
      return {
        time: t,
        values: {
          mu,
          x,
          v,
          r,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path },
      }
    },
    reset() {
      x = 0.2
      v = 0
      t = 0
    },
    setParams(p) {
      if (p.mu !== undefined) {
        mu = Number(p.mu)
        x = 0.2
        v = 0
        t = 0
      }
    },
  }
}

export const phasePortraitMeta: DemoMeta = {
  id: 'mech-phase-portrait',
  subject: '力学',
  category: '振动',
  tags: ['相空间', '极限环'],
  model: 'phasePortrait',
  adapter: 'phasePortrait',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'mu', label: 'μ（非线性）', kind: 'number', default: 1, min: 0.2, max: 3, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '相图' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'x',
      chartKey: 'x',
      charts: [
        {
          id: 'xv',
          title: 'x(t) / v(t)',
          xLabel: 't',
          leftLabel: 'x,v',
          series: [
            { key: 'x', label: 'x', color: '#fbbf24', unit: '' },
            { key: 'v', label: 'v', color: '#38bdf8', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'mu', label: 'μ', unit: '', tone: 'slate' },
    { key: 'x', label: 'x', unit: '', tone: 'amber' },
    { key: 'v', label: 'v', unit: '', tone: 'blue' },
  ],
  docs: {
    title: '相图与极限环示意',
    summary: '范德波尔振荡器在相平面 (x,v) 上趋近极限环；μ 越大环越“松弛”。',
    concept: ['相空间', '极限环', '非线性阻尼'],
    objectives: ['播放看轨线趋环', '调 μ 看环形变', '对照 x(t)'],
    formulas: ['\\ddot x-\\mu(1-x^2)\\dot x+x=0'],
    insight: '金点=当前状态；青轨=相轨。',
    legend: [
      { color: '#38bdf8', label: '相轨' },
      { color: '#fbbf24', label: '状态点' },
    ],
    steps: [
      {
        id: 'ring',
        title: '极限环',
        body: '播放至轨线明显闭合。',
        formulas: ['\\mu'],
        bindings: [
          { labelTex: 'x', valueKey: 'x', unit: '' },
          { labelTex: '\\mu', valueKey: 'mu', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'stiff',
        prompt: '取 μ≥2 看松弛振荡。',
        hint: '增大 μ。',
        check: { kind: 'paramNear', key: 'mu', target: 2.5, tol: 0.6 },
      },
    ],
  },
}

export function registerPhasePortraitDemo() {
  registerDemoBundle({
    meta: phasePortraitMeta,
    model: createPhasePortraitModel,
    adapter: createPhasePortraitAdapter,
  })
}
