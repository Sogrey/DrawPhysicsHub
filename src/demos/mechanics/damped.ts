import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createDampedAdapter } from './dampedAdapter'

/**
 * 欠阻尼：x = A₀ e^{-γt} cos(ω_d t + φ)
 * ω_d = √(ω₀² − γ²)，要求 γ < ω₀
 */
export function createDampedModel(): PhysicsModel {
  let A0 = 1.2
  let omega0 = 2.5
  let gamma = 0.35
  let phi = 0
  let t = 0
  let trail: number[][] = []

  function omegaD() {
    const g = Math.min(gamma, omega0 * 0.98)
    return Math.sqrt(Math.max(1e-12, omega0 * omega0 - g * g))
  }

  function damp() {
    return Math.min(gamma, omega0 * 0.98)
  }

  function period() {
    return (2 * Math.PI) / omegaD()
  }

  /** 包络衰减到约 5% 或至少 4 个阻尼周期 */
  function processEnd() {
    const g = Math.max(1e-6, damp())
    const tEnv = Math.log(20) / g
    return Math.max(4 * period(), Math.min(18, tEnv))
  }

  function stateAt(time: number) {
    const g = damp()
    const wd = omegaD()
    const env = A0 * Math.exp(-g * time)
    const phase = wd * time + phi
    const x = env * Math.cos(phase)
    const vx = -g * env * Math.cos(phase) - wd * env * Math.sin(phase)
    return { x, vx, env, g, wd }
  }

  function rebuildTrail(upto: number) {
    trail = []
    const n = Math.max(2, Math.ceil(upto / 0.02))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const { x } = stateAt(ti)
      trail.push([x, 0])
    }
  }

  return {
    init(params: ParamValues) {
      A0 = Number(params.A0 ?? 1.2)
      omega0 = Number(params.omega0 ?? 2.5)
      gamma = Number(params.gamma ?? 0.35)
      phi = (Number(params.phi ?? 0) * Math.PI) / 180
      t = 0
      const { x } = stateAt(0)
      trail = [[x, 0]]
    },
    step(dt: number) {
      const T = processEnd()
      t = Math.min(T, t + dt)
      const { x } = stateAt(t)
      trail.push([x, 0])
    },
    seek(time: number) {
      const T = processEnd()
      t = Math.min(T, Math.max(0, time))
      rebuildTrail(t)
    },
    observe(): ObserveSnapshot {
      const { x, vx, env, g, wd } = stateAt(t)
      const T = processEnd()
      const Td = period()
      return {
        time: t,
        values: {
          x,
          vx,
          speed: Math.abs(vx),
          A0,
          omega0,
          gamma: g,
          omegaD: wd,
          envelope: env,
          envelopeNeg: -env,
          phi: (phi * 180) / Math.PI,
          period: Td,
          tMax: T,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
      const { x } = stateAt(0)
      trail = [[x, 0]]
    },
    setParams(params) {
      if (params.A0 !== undefined) A0 = Number(params.A0)
      if (params.omega0 !== undefined) omega0 = Number(params.omega0)
      if (params.gamma !== undefined) gamma = Number(params.gamma)
      if (params.phi !== undefined) phi = (Number(params.phi) * Math.PI) / 180
    },
  }
}

export const dampedMeta: DemoMeta = {
  id: 'mech-damped',
  subject: '力学',
  category: '振动',
  tags: ['阻尼', '振动', '欠阻尼'],
  model: 'damped',
  adapter: 'damped',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'A0',
      label: '初振幅 A₀',
      kind: 'number',
      default: 1.2,
      min: 0.3,
      max: 2.5,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'omega0',
      label: '固有角频 ω₀',
      kind: 'number',
      default: 2.5,
      min: 1,
      max: 6,
      step: 0.1,
      unit: 'rad/s',
    },
    {
      key: 'gamma',
      label: '阻尼 γ',
      kind: 'number',
      default: 0.35,
      min: 0.05,
      max: 2.2,
      step: 0.05,
      unit: '1/s',
    },
    {
      key: 'phi',
      label: '初相 φ',
      kind: 'number',
      default: 0,
      min: -180,
      max: 180,
      step: 5,
      unit: '°',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '振动' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'x',
      charts: [
        {
          id: 'xenv',
          title: 'x(t) 与包络 ±A₀e^{−γt}',
          xLabel: 't (s)',
          leftLabel: 'x (m)',
          series: [
            { key: 'x', label: 'x', color: '#38bdf8', unit: 'm' },
            { key: 'envelope', label: '+包络', color: '#a78bfa', unit: 'm' },
            { key: 'envelopeNeg', label: '−包络', color: '#c4b5fd', unit: 'm' },
          ],
        },
        {
          id: 'vel',
          title: '速度 v(t)',
          xLabel: 't (s)',
          leftLabel: 'v (m/s)',
          series: [{ key: 'vx', label: 'v', color: '#4ade80', unit: 'm/s' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'x', label: 'x', unit: 'm', tone: 'slate' },
    { key: 'vx', label: 'v', unit: 'm/s', tone: 'green' },
    { key: 'envelope', label: '包络', unit: 'm', tone: 'purple' },
    { key: 'omegaD', label: 'ω_d', unit: 'rad/s', tone: 'blue' },
    { key: 'period', label: 'T_d', unit: 's', tone: 'amber' },
    { key: 'gamma', label: 'γ', unit: '1/s', tone: 'cyan' },
  ],
  docs: {
    title: '阻尼振动（欠阻尼）',
    summary:
      '线性阻尼下的欠阻尼振动：振幅按 e^{−γt} 衰减，振荡角频率 ω_d = √(ω₀²−γ²)。调节阻尼观察衰减快慢；「保留对比」可叠无阻尼参考轨迹。',
    concept: [
      '实际振动常有阻力。线性阻尼下，欠阻尼（γ < ω₀）运动为衰减振荡：包络指数下降，频率略低于固有频率。',
      '本演示限制在欠阻尼区（γ 会钳制到略小于 ω₀）。曲线页同时画出 ±包络，便于对照。',
    ],
    objectives: [
      '理解欠阻尼包络与 γ 的关系',
      '区分 ω₀ 与 ω_d',
      '对比无阻尼（对比轨迹）与有阻尼轨迹',
    ],
    formulas: [
      'x = A_0 e^{-\\gamma t}\\cos(\\omega_d t + \\varphi)',
      '\\omega_d = \\sqrt{\\omega_0^2 - \\gamma^2}',
      'T_d = \\dfrac{2\\pi}{\\omega_d}',
    ],
    insight: 'γ 越大衰减越快；γ → 0 时退化为简谐。临界阻尼在 γ = ω₀（本 demo 不进入过阻尼）。',
    legend: [
      { color: '#38bdf8', label: '已走过路径' },
      { id: 'compare', color: '#f472b6', label: '无阻尼对比' },
      { color: '#4ade80', label: '速度方向' },
      { color: '#94a3b8', label: '平衡位置' },
    ],
    steps: [
      {
        id: 'law',
        title: '欠阻尼解',
        body: '位移 = 指数衰减包络 × 余弦振荡。',
        formulas: ['x = A_0 e^{-\\gamma t}\\cos(\\omega_d t + \\varphi)'],
        bindings: [
          { labelTex: 'A_0', valueKey: 'A0', unit: 'm' },
          { labelTex: '\\gamma', valueKey: 'gamma', unit: '1/s' },
          { labelTex: '\\omega_d', valueKey: 'omegaD', unit: 'rad/s' },
        ],
      },
      {
        id: 'live',
        title: '瞬时状态',
        body: '拖动时间轴，对照位置、速度与瞬时包络。',
        formulas: ['\\mathrm{envelope} = A_0 e^{-\\gamma t}'],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's' },
          { labelTex: 'x', valueKey: 'x', unit: 'm' },
          { labelTex: 'v', valueKey: 'vx', unit: 'm/s' },
          { labelTex: 'env', valueKey: 'envelope', unit: 'm' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'freq',
        title: '阻尼频率',
        body: '有阻尼时振荡变慢：ω_d < ω₀。',
        formulas: ['\\omega_d = \\sqrt{\\omega_0^2 - \\gamma^2}'],
        bindings: [
          { labelTex: '\\omega_0', valueKey: 'omega0', unit: 'rad/s' },
          { labelTex: '\\omega_d', valueKey: 'omegaD', unit: 'rad/s' },
          { labelTex: 'T_d', valueKey: 'period', unit: 's' },
        ],
      },
    ],
    challenges: [
      {
        id: 'strong-damp',
        prompt: '增大 γ 到约 1.0 /s，观察包络更快塌缩。',
        hint: '直接拖动阻尼滑条；保持 γ < ω₀ 以留在欠阻尼。',
        check: { kind: 'paramNear', key: 'gamma', target: 1, tol: 0.12 },
      },
      {
        id: 'weak-damp',
        prompt: '把 γ 调到约 0.1 /s，再点「保留对比」对比无阻尼扫掠。',
        hint: '小阻尼时轨迹更接近简谐；对比线为无阻尼参考。',
        check: { kind: 'paramNear', key: 'gamma', target: 0.1, tol: 0.06 },
      },
    ],
  },
}

export function registerDampedDemo(): void {
  registerDemoBundle({
    meta: dampedMeta,
    model: createDampedModel,
    adapter: createDampedAdapter,
  })
}
