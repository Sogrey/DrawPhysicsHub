import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createTimeDilationAdapter } from './timeDilationAdapter'
import { lorentzGamma } from './minkowski'

/** 固有时 τ → 实验室时间 t=γτ */
export function dilatedTime(tau: number, beta: number): number {
  return lorentzGamma(beta) * Math.max(0, tau)
}

/** 静长 L0 → 运动杆长度 L=L0/γ */
export function contractedLength(L0: number, beta: number): number {
  return Math.max(0, L0) / lorentzGamma(beta)
}

export function createTimeDilationModel(): PhysicsModel {
  let beta = 0.6
  let L0 = 2
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      beta = Number(p.beta ?? 0.6)
      L0 = Number(p.L0 ?? 2)
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
      const tau = t // 运动钟固有时随播放推进
      const tLab = dilatedTime(tau, b)
      const L = contractedLength(L0, b)
      // 钟面指针角
      const angProper = (2 * Math.PI * tau) / period
      const angLab = (2 * Math.PI * Math.min(period, tLab / g)) / period // 同固有角对照用
      // 杆端点轨迹（静系看运动杆）
      const xC = -1 + (2 * t) / period
      return {
        time: t,
        values: {
          beta: b,
          gamma: g,
          tau,
          tLab,
          L0,
          L,
          ratio: g,
          angProper,
          angLab,
          xC,
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
      if (p.beta !== undefined) beta = Number(p.beta)
      if (p.L0 !== undefined) L0 = Number(p.L0)
    },
  }
}

export const timeDilationMeta: DemoMeta = {
  id: 'rel-time-dilation',
  subject: '近代物理',
  category: '狭义相对论',
  tags: ['时间膨胀', '长度收缩'],
  model: 'timeDilation',
  adapter: 'timeDilation',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'beta', label: 'β = v/c', kind: 'number', default: 0.6, min: 0, max: 0.9, step: 0.05, unit: '' },
    { key: 'L0', label: '静长 L₀', kind: 'number', default: 2, min: 1, max: 3, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '钟与杆' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: '时胀',
      chartKey: 'tLab',
      charts: [
        {
          id: 't',
          title: '实验室时间 vs 固有时',
          xLabel: 't',
          leftLabel: '时间',
          series: [
            { key: 'tau', label: 'τ', color: '#38bdf8', unit: 's' },
            { key: 'tLab', label: 't=γτ', color: '#fbbf24', unit: 's' },
            { key: 'L', label: 'L', color: '#a78bfa', unit: '' },
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
    { key: 'tLab', label: 't_lab', unit: 's', tone: 'purple' },
    { key: 'L', label: 'L', unit: '', tone: 'blue' },
  ],
  docs: {
    title: '时间膨胀 / 长度收缩示意',
    summary: '运动钟变慢 t=γτ；沿运动方向杆缩短 L=L₀/γ。对照两只钟与静/动杆长度。',
    concept: ['固有时', '时间膨胀', '长度收缩'],
    objectives: ['调 β 看 γ', '播放对比 τ 与 t', '观察杆长缩短'],
    formulas: ['t=\\gamma\\tau', 'L=L_0/\\gamma', '\\gamma=1/\\sqrt{1-\\beta^2}'],
    insight: '左=运动钟（固有时）；右=实验室钟（走得更快）；下方杆长随 γ 收缩。',
    legend: [
      { color: '#38bdf8', label: '固有钟' },
      { color: '#fbbf24', label: '实验室钟' },
      { color: '#a78bfa', label: '运动杆' },
    ],
    steps: [
      {
        id: 'dilate',
        title: '时胀',
        body: '播放后读 t_lab 与 τ 之比 ≈ γ。',
        formulas: ['t=\\gamma\\tau'],
        bindings: [
          { labelTex: '\\tau', valueKey: 'tau', unit: 's' },
          { labelTex: 't', valueKey: 'tLab', unit: 's' },
          { labelTex: '\\gamma', valueKey: 'gamma', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'half',
        prompt: '取 β≈0.87 使 γ≈2，杆长约减半。',
        hint: 'β≈√(1−1/γ²)。',
        check: { kind: 'paramNear', key: 'beta', target: 0.87, tol: 0.08 },
      },
    ],
  },
}

export function registerTimeDilationDemo() {
  registerDemoBundle({
    meta: timeDilationMeta,
    model: createTimeDilationModel,
    adapter: createTimeDilationAdapter,
  })
}
