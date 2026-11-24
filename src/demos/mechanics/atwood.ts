import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createAtwoodAdapter } from './atwoodAdapter'

/** a = g(m2−m1)/(m1+m2)；T = 2 m1 m2 g /(m1+m2)（m2 侧下降为正 a） */
export function atwoodAccel(m1: number, m2: number, g = 9.8) {
  const s = Math.max(1e-9, m1 + m2)
  return (g * (m2 - m1)) / s
}

export function atwoodTension(m1: number, m2: number, g = 9.8) {
  const s = Math.max(1e-9, m1 + m2)
  return (2 * m1 * m2 * g) / s
}

export function createAtwoodModel(): PhysicsModel {
  let m1 = 1
  let m2 = 1.4
  let t = 0
  const period = 6
  const g = 9.8

  return {
    init(p: ParamValues) {
      m1 = Number(p.m1 ?? 1)
      m2 = Number(p.m2 ?? 1.4)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const a = atwoodAccel(m1, m2, g)
      const T = atwoodTension(m1, m2, g)
      const y0 = 1.2
      const y = Math.max(-1.4, Math.min(1.4, y0 + 0.5 * a * t * t * 0.08))
      return {
        time: t,
        values: {
          m1,
          m2,
          a,
          T,
          y,
          yOpp: -y,
          g,
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
      if (p.m1 !== undefined) m1 = Number(p.m1)
      if (p.m2 !== undefined) m2 = Number(p.m2)
    },
  }
}

export const atwoodMeta: DemoMeta = {
  id: 'mech-atwood',
  subject: '力学',
  category: '牛顿定律',
  tags: ['连接体', '张力'],
  model: 'atwood',
  adapter: 'atwood',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'm1', label: 'm₁', kind: 'number', default: 1, min: 0.4, max: 2.5, step: 0.1, unit: 'kg' },
    { key: 'm2', label: 'm₂', kind: 'number', default: 1.4, min: 0.4, max: 2.5, step: 0.1, unit: 'kg' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '阿特伍德' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'a',
      chartKey: 'a',
      charts: [
        {
          id: 'a',
          title: '加速度与张力',
          xLabel: 't',
          leftLabel: 'a,T',
          series: [
            { key: 'a', label: 'a', color: '#fbbf24', unit: 'm/s²' },
            { key: 'T', label: 'T', color: '#a78bfa', unit: 'N' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'a', label: 'a', unit: 'm/s²', tone: 'amber' },
    { key: 'T', label: 'T', unit: 'N', tone: 'purple' },
  ],
  docs: {
    title: '阿特伍德机',
    summary: '两质量经轻绳过定滑轮：a=g(m₂−m₁)/(m₁+m₂)，T=2m₁m₂g/(m₁+m₂)。',
    concept: ['连接体', '张力', '牛顿第二定律'],
    objectives: ['改质量比看 a', '读出张力', '等质量时 a=0'],
    formulas: ['a=g(m_2-m_1)/(m_1+m_2)', 'T=2m_1 m_2 g/(m_1+m_2)'],
    insight: '右侧 m₂ 较大时下降；绳长约束使两侧位移相反。',
    legend: [
      { color: '#38bdf8', label: 'm₁' },
      { color: '#fbbf24', label: 'm₂' },
      { color: '#a78bfa', label: '绳/张力' },
    ],
    steps: [
      {
        id: 'ratio',
        title: '质量比',
        body: '增大 m₂−m₁ 观察 |a| 增大。',
        formulas: ['a'],
        bindings: [
          { labelTex: 'a', valueKey: 'a', unit: 'm/s^2' },
          { labelTex: 'T', valueKey: 'T', unit: 'N' },
        ],
      },
    ],
    challenges: [
      {
        id: 'balance',
        prompt: '取 m₁≈m₂，使 |a| 很小。',
        hint: '两质量接近。',
        check: { kind: 'paramNear', key: 'm2', target: 1, tol: 0.15 },
      },
    ],
  },
}

export function registerAtwoodDemo() {
  registerDemoBundle({ meta: atwoodMeta, model: createAtwoodModel, adapter: createAtwoodAdapter })
}
