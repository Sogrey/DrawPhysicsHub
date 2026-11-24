import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createVariableMassAdapter } from './variableMassAdapter'

/** 理想火箭：v = v0 + u ln(m0/m)，u=排气相对速度 */
export function rocketDeltaV(m0: number, m: number, u: number): number {
  const mm = Math.max(1e-6, m)
  const m00 = Math.max(mm, m0)
  return u * Math.log(m00 / mm)
}

export function createVariableMassModel(): PhysicsModel {
  let m0 = 4
  let uEx = 3
  let burnRate = 0.35
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      m0 = Number(p.m0 ?? 4)
      uEx = Number(p.uEx ?? 3)
      burnRate = Number(p.burnRate ?? 0.35)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const mMin = 0.8
      const m = Math.max(mMin, m0 - burnRate * t)
      const v = rocketDeltaV(m0, m, uEx)
      const y = Math.min(2.2, 0.15 * v * t * 0.2)
      const thrusting = m > mMin + 0.02 ? 1 : 0
      return {
        time: t,
        values: {
          m0,
          m,
          uEx,
          v,
          y,
          thrusting,
          ratio: m0 / Math.max(1e-6, m),
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
      if (p.m0 !== undefined) m0 = Number(p.m0)
      if (p.uEx !== undefined) uEx = Number(p.uEx)
      if (p.burnRate !== undefined) burnRate = Number(p.burnRate)
    },
  }
}

export const variableMassMeta: DemoMeta = {
  id: 'mech-variable-mass',
  subject: '力学',
  category: '动量',
  tags: ['火箭', '变质量'],
  model: 'variableMass',
  adapter: 'variableMass',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'm0', label: '初质量 m₀', kind: 'number', default: 4, min: 2, max: 6, step: 0.2, unit: '' },
    { key: 'uEx', label: '排气速 u', kind: 'number', default: 3, min: 1, max: 5, step: 0.2, unit: '' },
    { key: 'burnRate', label: '燃速', kind: 'number', default: 0.35, min: 0.1, max: 0.6, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '火箭' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'v',
      chartKey: 'v',
      charts: [
        {
          id: 'v',
          title: '速度与质量',
          xLabel: 't',
          leftLabel: 'v,m',
          series: [
            { key: 'v', label: 'v', color: '#fbbf24', unit: '' },
            { key: 'm', label: 'm', color: '#38bdf8', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'm', label: 'm', unit: '', tone: 'blue' },
    { key: 'v', label: 'v', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '变质量系统（火箭）示意',
    summary: '齐奥尔科夫斯基：Δv = u ln(m₀/m)。质量随燃烧下降，速度对数增长。',
    concept: ['动量守恒', '变质量', '排气速度'],
    objectives: ['播放看 m↓ v↑', '增大 u 看 Δv', '对照 ln(m₀/m)'],
    formulas: ['v=u\\ln(m_0/m)'],
    insight: '尾焰示意排气；金读数=当前速度。',
    legend: [
      { color: '#fbbf24', label: '火箭' },
      { color: '#f472b6', label: '尾焰' },
    ],
    steps: [
      {
        id: 'burn',
        title: '燃烧',
        body: '播放至质量明显下降。',
        formulas: ['v'],
        bindings: [
          { labelTex: 'm', valueKey: 'm', unit: '' },
          { labelTex: 'v', valueKey: 'v', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'fast',
        prompt: '取较大排气速 u≥4。',
        hint: '调 u 滑条。',
        check: { kind: 'paramNear', key: 'uEx', target: 4.5, tol: 0.6 },
      },
    ],
  },
}

export function registerVariableMassDemo() {
  registerDemoBundle({
    meta: variableMassMeta,
    model: createVariableMassModel,
    adapter: createVariableMassAdapter,
  })
}
