import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createMinkowskiAdapter } from './minkowskiAdapter'

/** γ = 1/√(1−β²)，β∈[0,0.99] */
export function lorentzGamma(beta: number): number {
  const b = Math.max(0, Math.min(0.99, Math.abs(beta)))
  return 1 / Math.sqrt(1 - b * b)
}

/**
 * 静止系同时线 ct=const 上的事件，在 β 动系中的时间差（教学单位 c=1）。
 * 两事件间隔 Δx，动系 Δt' = −γ β Δx。
 */
export function simultaneityGap(beta: number, deltaX: number): number {
  const g = lorentzGamma(beta)
  return -g * beta * deltaX
}

export function createMinkowskiModel(): PhysicsModel {
  let beta = 0.6
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      beta = Number(p.beta ?? 0.6)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const b = Math.max(0, Math.min(0.9, beta))
      const g = lorentzGamma(b)
      const ct = (2.8 * t) / period
      // 静止世界线 x=0；运动世界线 x=β·ct
      const rest: number[][] = []
      const moving: number[][] = []
      for (let i = 0; i <= 40; i++) {
        const cti = (3.2 * i) / 40
        rest.push([0, cti])
        moving.push([b * cti, cti])
      }
      // 光锥
      const lightR: number[][] = []
      const lightL: number[][] = []
      for (let i = 0; i <= 20; i++) {
        const cti = (3.2 * i) / 20
        lightR.push([cti, cti])
        lightL.push([-cti, cti])
      }
      // 静止系同时线（水平）与动系同时线（斜率 β，经当前事件）
      const x0 = b * ct
      const simRest: number[][] = [
        [-2.5, ct],
        [2.5, ct],
      ]
      // ct' = const ⇔ ct − β x = const；过 (x0,ct)：ct = ct0 + β(x−x0)  wait
      // 动系同时：Δt'=0 ⇒ Δt = β Δx（c=1）⇒ ct − β x = const
      const constSim = ct - b * x0
      const simMove: number[][] = [
        [-2.5, constSim + b * -2.5],
        [2.5, constSim + b * 2.5],
      ]
      const gap = Math.abs(simultaneityGap(b, 2))
      return {
        time: t,
        values: {
          beta: b,
          gamma: g,
          ct,
          x: x0,
          gap,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { rest, moving, lightR, lightL, simRest, simMove },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.beta !== undefined) beta = Number(p.beta)
    },
  }
}

export const minkowskiMeta: DemoMeta = {
  id: 'rel-minkowski',
  subject: '近代物理',
  category: '狭义相对论',
  tags: ['相对论', '闵氏图', '同时性'],
  model: 'minkowski',
  adapter: 'minkowski',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'beta', label: 'β = v/c', kind: 'number', default: 0.6, min: 0, max: 0.9, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '闵氏图' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'γ',
      chartKey: 'gamma',
      charts: [
        {
          id: 'g',
          title: '洛伦兹因子',
          xLabel: 't',
          leftLabel: 'γ',
          series: [
            { key: 'gamma', label: 'γ', color: '#fbbf24', unit: '' },
            { key: 'gap', label: '|Δt′| (Δx=2)', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'beta', label: 'β', unit: '', tone: 'slate' },
    { key: 'gamma', label: 'γ', unit: '', tone: 'amber' },
    { key: 'gap', label: '|Δt′|', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '闵氏图与同时性',
    summary: '时空图（x–ct）上画静止/运动世界线与光锥；水平线=静止系同时，斜线=运动系同时。',
    concept: ['世界线', '光锥', '同时性相对性'],
    objectives: ['调 β 看世界线倾斜', '对比两条同时线', '读出 γ 与同时性差'],
    formulas: ['\\gamma=1/\\sqrt{1-\\beta^2}', "\\Delta t'=-\\gamma\\beta\\Delta x\\ (c=1)"],
    insight: '金=运动世界线；紫斜线=动系同时；播放沿世界线推进事件。',
    legend: [
      { color: '#38bdf8', label: '静止世界线' },
      { color: '#fbbf24', label: '运动世界线' },
      { color: '#94a3b8', label: '光锥' },
      { color: '#a78bfa', label: '动系同时' },
    ],
    steps: [
      {
        id: 'tilt',
        title: '同时线倾斜',
        body: '增大 β，看紫斜线相对水平线张开。',
        formulas: ['\\beta'],
        bindings: [
          { labelTex: '\\beta', valueKey: 'beta', unit: '' },
          { labelTex: '\\gamma', valueKey: 'gamma', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'fast',
        prompt: '取 β≥0.7，观察同时性差变大。',
        hint: '拖动 β 滑条。',
        check: { kind: 'paramNear', key: 'beta', target: 0.8, tol: 0.15 },
      },
    ],
  },
}

export function registerMinkowskiDemo() {
  registerDemoBundle({ meta: minkowskiMeta, model: createMinkowskiModel, adapter: createMinkowskiAdapter })
}
