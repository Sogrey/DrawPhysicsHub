import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createForcedAdapter } from './forcedAdapter'

/**
 * 受迫振动稳态（m=1）：
 *   ẍ + 2γẋ + ω₀² x = F₀ cos(ω t)
 *   A = F₀ / √[(ω₀²−ω²)² + (2γω)²]
 *   δ = atan2(2γω, ω₀²−ω²)
 *   x = A cos(ω t − δ)
 */
export function createForcedModel(): PhysicsModel {
  let omega0 = 3
  let gamma = 0.25
  let omega = 2
  let F0 = 1.2
  let t = 0
  let trail: number[][] = []

  function ampPhase() {
    const g = Math.max(0, gamma)
    const w0 = Math.max(1e-6, omega0)
    const w = Math.max(1e-6, omega)
    const detune = w0 * w0 - w * w
    const dampTerm = 2 * g * w
    const denom = Math.sqrt(detune * detune + dampTerm * dampTerm) || 1e-12
    const A = F0 / denom
    const delta = Math.atan2(dampTerm, detune) // [0, π]
    return { A, delta, g, w0, w }
  }

  /** 位移共振角频（γ < ω₀/√2 时） */
  function omegaRes() {
    const g = Math.max(0, gamma)
    const w0 = Math.max(1e-6, omega0)
    const inner = w0 * w0 - 2 * g * g
    return inner > 0 ? Math.sqrt(inner) : 0
  }

  function drivePeriod() {
    return (2 * Math.PI) / Math.max(1e-6, omega)
  }

  function processEnd() {
    return Math.max(8, 6 * drivePeriod())
  }

  function stateAt(time: number) {
    const { A, delta, g, w0, w } = ampPhase()
    const phase = w * time - delta
    const x = A * Math.cos(phase)
    const vx = -A * w * Math.sin(phase)
    const drive = F0 * Math.cos(w * time)
    return { x, vx, A, delta, g, w0, w, drive }
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
      omega0 = Number(params.omega0 ?? 3)
      gamma = Number(params.gamma ?? 0.25)
      omega = Number(params.omega ?? 2)
      F0 = Number(params.F0 ?? 1.2)
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
      const { x, vx, A, delta, g, w0, w, drive } = stateAt(t)
      const T = processEnd()
      const Td = drivePeriod()
      const wR = omegaRes()
      return {
        time: t,
        values: {
          x,
          vx,
          speed: Math.abs(vx),
          A: A,
          Ass: A,
          A0: A,
          omega0: w0,
          omega: w,
          gamma: g,
          F0,
          drive,
          delta: (delta * 180) / Math.PI,
          omegaR: wR,
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
      if (params.omega0 !== undefined) omega0 = Number(params.omega0)
      if (params.gamma !== undefined) gamma = Number(params.gamma)
      if (params.omega !== undefined) omega = Number(params.omega)
      if (params.F0 !== undefined) F0 = Number(params.F0)
    },
  }
}

export const forcedMeta: DemoMeta = {
  id: 'mech-forced',
  subject: '力学',
  category: '振动',
  tags: ['受迫', '共振', '振动'],
  model: 'forced',
  adapter: 'forced',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'omega0',
      label: '固有角频 ω₀',
      kind: 'number',
      default: 3,
      min: 1,
      max: 6,
      step: 0.1,
      unit: 'rad/s',
    },
    {
      key: 'omega',
      label: '驱动角频 ω',
      kind: 'number',
      default: 2,
      min: 0.5,
      max: 6,
      step: 0.1,
      unit: 'rad/s',
    },
    {
      key: 'gamma',
      label: '阻尼 γ',
      kind: 'number',
      default: 0.25,
      min: 0.05,
      max: 1.5,
      step: 0.05,
      unit: '1/s',
    },
    {
      key: 'F0',
      label: '驱动力幅 F₀',
      kind: 'number',
      default: 1.2,
      min: 0.2,
      max: 3,
      step: 0.1,
      unit: 'N',
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
          id: 'xdrive',
          title: 'x(t) 与驱动力 F₀cos(ωt)',
          xLabel: 't (s)',
          leftLabel: 'x / F',
          series: [
            { key: 'x', label: 'x', color: '#38bdf8', unit: 'm' },
            { key: 'drive', label: 'F(t)', color: '#fbbf24', unit: 'N' },
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
    { key: 'Ass', label: 'A', unit: 'm', tone: 'blue' },
    { key: 'delta', label: 'δ', unit: '°', tone: 'amber' },
    { key: 'omegaR', label: 'ω_r', unit: 'rad/s', tone: 'purple' },
    { key: 'drive', label: 'F(t)', unit: 'N', tone: 'cyan' },
  ],
  docs: {
    title: '受迫振动与共振',
    summary:
      '简谐驱动力下的稳态响应：振幅 A(ω)、相位差 δ(ω)。调节驱动频率靠近 ω₀（或位移共振 ω_r）观察振幅增大；阻尼越大共振峰越矮越宽。',
    concept: [
      '实际振动常受周期性外力。稳态时系统以驱动频率 ω 振荡，振幅与相位由 ω₀、γ、ω、F₀ 共同决定。',
      '位移共振频率 ω_r = √(ω₀² − 2γ²)（当 γ < ω₀/√2）；弱阻尼时 ω_r ≈ ω₀。相位差 δ 在共振附近由 0 过渡到 π。',
    ],
    objectives: [
      '理解稳态振幅 A 与相位差 δ 随 ω 的变化',
      '通过调 ω 观察共振峰',
      '认识阻尼对共振峰高度与宽度的影响',
    ],
    formulas: [
      'A = \\dfrac{F_0}{\\sqrt{(\\omega_0^2-\\omega^2)^2+(2\\gamma\\omega)^2}}',
      '\\delta = \\mathrm{atan2}(2\\gamma\\omega,\\,\\omega_0^2-\\omega^2)',
      'x = A\\cos(\\omega t - \\delta)',
      '\\omega_r = \\sqrt{\\omega_0^2-2\\gamma^2}\\quad(\\gamma<\\omega_0/\\sqrt{2})',
    ],
    insight:
      'ω ≪ ω₀ 时 δ≈0、A≈F₀/ω₀²；ω ≫ ω₀ 时 δ→π、A→0；共振附近振幅最大且相位跃变。',
    legend: [
      { color: '#38bdf8', label: '已走过路径' },
      { id: 'compare', color: '#f472b6', label: '同幅固有振动' },
      { color: '#4ade80', label: '速度方向' },
      { color: '#fbbf24', label: '驱动力（曲线）' },
      { color: '#94a3b8', label: '平衡位置' },
    ],
    steps: [
      {
        id: 'amp',
        title: '稳态振幅',
        body: '分母中的失谐项与阻尼项共同决定 A；ω → ω₀ 时分母变小，振幅升高。',
        formulas: [
          'A = \\dfrac{F_0}{\\sqrt{(\\omega_0^2-\\omega^2)^2+(2\\gamma\\omega)^2}}',
        ],
        bindings: [
          { labelTex: 'F_0', valueKey: 'F0', unit: 'N' },
          { labelTex: '\\omega_0', valueKey: 'omega0', unit: 'rad/s' },
          { labelTex: '\\omega', valueKey: 'omega', unit: 'rad/s' },
          { labelTex: 'A', valueKey: 'Ass', unit: 'm' },
        ],
      },
      {
        id: 'phase',
        title: '相位差',
        body: '位移落后驱动力 δ；过共振后趋于反相。',
        formulas: ['\\delta = \\mathrm{atan2}(2\\gamma\\omega,\\,\\omega_0^2-\\omega^2)'],
        bindings: [
          { labelTex: '\\delta', valueKey: 'delta', unit: '°' },
          { labelTex: '\\gamma', valueKey: 'gamma', unit: '1/s' },
        ],
      },
      {
        id: 'live',
        title: '瞬时状态',
        body: '拖动时间轴，对照位移、速度与瞬时驱动力。',
        formulas: ['x = A\\cos(\\omega t - \\delta)'],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's' },
          { labelTex: 'x', valueKey: 'x', unit: 'm' },
          { labelTex: 'v', valueKey: 'vx', unit: 'm/s' },
          { labelTex: 'F(t)', valueKey: 'drive', unit: 'N' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'res',
        title: '位移共振',
        body: '弱阻尼下把 ω 调到 ω_r 附近，振幅接近峰值。',
        formulas: ['\\omega_r = \\sqrt{\\omega_0^2-2\\gamma^2}'],
        bindings: [
          { labelTex: '\\omega_r', valueKey: 'omegaR', unit: 'rad/s' },
          { labelTex: '\\omega', valueKey: 'omega', unit: 'rad/s' },
          { labelTex: 'A', valueKey: 'Ass', unit: 'm' },
        ],
      },
    ],
    challenges: [
      {
        id: 'near-res',
        prompt: '把驱动角频 ω 调到接近 ω₀（约 3.0 rad/s），观察振幅明显增大。',
        hint: '默认 ω₀=3；也可对照读数里的 ω_r。',
        check: { kind: 'paramNear', key: 'omega', target: 3, tol: 0.2 },
      },
      {
        id: 'heavy-damp',
        prompt: '增大 γ 到约 1.0 /s，再回到共振附近，感受峰变更矮。',
        hint: '大阻尼时即便 ω≈ω₀，A 也明显小于小阻尼情形。',
        check: { kind: 'paramNear', key: 'gamma', target: 1, tol: 0.15 },
      },
    ],
  },
}

export function registerForcedDemo(): void {
  registerDemoBundle({
    meta: forcedMeta,
    model: createForcedModel,
    adapter: createForcedAdapter,
  })
}
