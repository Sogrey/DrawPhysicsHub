import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createHarmonicAdapter } from './harmonicAdapter'

/** 水平简谐振动：x = A cos(ωt + φ) */
export function createHarmonicModel(): PhysicsModel {
  let A = 1
  let omega = 2
  let phi = 0
  let t = 0
  let trail: number[][] = []

  function period() {
    return (2 * Math.PI) / Math.max(1e-9, omega)
  }

  function stateAt(time: number) {
    const x = A * Math.cos(omega * time + phi)
    const vx = -A * omega * Math.sin(omega * time + phi)
    return { x, vx }
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
      A = Number(params.A ?? 1)
      omega = Number(params.omega ?? 2)
      phi = ((Number(params.phi ?? 0) * Math.PI) / 180)
      t = 0
      trail = [[A * Math.cos(phi), 0]]
    },
    step(dt: number) {
      const T = period()
      t = Math.min(T, t + dt)
      const { x } = stateAt(t)
      trail.push([x, 0])
    },
    seek(time: number) {
      const T = period()
      t = Math.min(T, Math.max(0, time))
      rebuildTrail(t)
    },
    observe(): ObserveSnapshot {
      const { x, vx } = stateAt(t)
      const T = period()
      const E = 0.5 * (omega * omega) * A * A // m=1 时机械能 ∝
      return {
        time: t,
        values: {
          x,
          vx,
          speed: Math.abs(vx),
          A,
          omega,
          phi: (phi * 180) / Math.PI,
          period: T,
          tMax: T,
          energy: E,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
      trail = [[A * Math.cos(phi), 0]]
    },
    setParams(params) {
      if (params.A !== undefined) A = Number(params.A)
      if (params.omega !== undefined) omega = Number(params.omega)
      if (params.phi !== undefined) phi = (Number(params.phi) * Math.PI) / 180
    },
  }
}

export const harmonicMeta: DemoMeta = {
  id: 'mech-harmonic',
  subject: '力学',
  category: '振动',
  tags: ['简谐', '振动', 'adapter-验收'],
  model: 'harmonic',
  adapter: 'harmonic',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'A',
      label: '振幅 A',
      kind: 'number',
      default: 1.2,
      min: 0.2,
      max: 3,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'omega',
      label: '角频率 ω',
      kind: 'number',
      default: 2,
      min: 0.5,
      max: 6,
      step: 0.1,
      unit: 'rad/s',
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
          id: 'xv',
          title: 'x(t) 与 v(t)',
          xLabel: 't (s)',
          leftLabel: 'x (m)',
          rightLabel: 'v (m/s)',
          series: [
            { key: 'x', label: 'x', color: '#38bdf8', unit: 'm', axis: 'left' },
            { key: 'vx', label: 'v', color: '#4ade80', unit: 'm/s', axis: 'right' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'x', label: 'x', unit: 'm', tone: 'slate' },
    { key: 'vx', label: 'v', unit: 'm/s', tone: 'green' },
    { key: 'period', label: 'T', unit: 's', tone: 'purple' },
    { key: 'A', label: 'A', unit: 'm', tone: 'amber' },
    { key: 'omega', label: 'ω', unit: 'rad/s', tone: 'blue' },
  ],
  docs: {
    title: '简谐振动',
    summary:
      '水平弹簧振子（理想无阻尼）：位移按余弦规律变化。调节振幅、角频率与初相，观察一个周期内的运动与 x–v 曲线。',
    concept: [
      '简谐振动是回复力与位移成正比且方向相反时的运动。取平衡位置为原点，位移可写成 x = A cos(ωt + φ)。',
      '本演示取一个周期 T = 2π/ω 为过程长度；时间轴 scrub 可对照瞬时位置与速度。对比轨迹用于保留上一组振幅下的位移扫掠。',
    ],
    objectives: [
      '理解振幅、角频率、初相对波形的影响',
      '观察速度超前位移 π/2 的相位关系',
      '用读数验证 T = 2π/ω',
    ],
    formulas: [
      'x = A\\cos(\\omega t + \\varphi)',
      'v = -A\\omega\\sin(\\omega t + \\varphi)',
      'T = \\dfrac{2\\pi}{\\omega}',
    ],
    insight: '角速度 ω 增大时周期变短；振幅只改变位移范围，不改变周期。',
    legend: [
      { color: '#38bdf8', label: '已走过路径' },
      { id: 'compare', color: '#f472b6', label: '对比扫掠' },
      { color: '#4ade80', label: '速度方向' },
      { color: '#94a3b8', label: '平衡位置' },
    ],
    steps: [
      {
        id: 'law',
        title: '运动方程',
        body: '位移随时间按余弦变化；ω 与振幅 A、初相 φ 由初始条件与系统决定。',
        formulas: ['x = A\\cos(\\omega t + \\varphi)'],
        bindings: [
          { labelTex: 'A', valueKey: 'A', unit: 'm' },
          { labelTex: '\\omega', valueKey: 'omega', unit: 'rad/s' },
          { labelTex: '\\varphi', valueKey: 'phi', unit: 'deg' },
        ],
      },
      {
        id: 'vel',
        title: '速度',
        body: '对时间求导得速度；极值出现在平衡位置附近。',
        formulas: ['v = -A\\omega\\sin(\\omega t + \\varphi)'],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's' },
          { labelTex: 'x', valueKey: 'x', unit: 'm' },
          { labelTex: 'v', valueKey: 'vx', unit: 'm/s' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'period',
        title: '周期',
        body: '一个完整来回所需时间只依赖角频率。',
        formulas: ['T = \\dfrac{2\\pi}{\\omega}'],
        bindings: [{ labelTex: 'T', valueKey: 'period', unit: 's' }],
      },
    ],
    challenges: [
      {
        id: 'period-pi',
        prompt: '调节 ω，使周期 T ≈ 2.0 s（容差 ±0.08 s）。',
        hint: 'T = 2π/ω ⇒ ω ≈ π ≈ 3.14 rad/s。',
        check: { kind: 'valueNear', key: 'period', target: 2, tol: 0.08 },
      },
      {
        id: 'amp-2',
        prompt: '将振幅 A 调到约 2.0 m。',
        hint: '直接拖动振幅滑条。',
        check: { kind: 'paramNear', key: 'A', target: 2, tol: 0.08 },
      },
    ],
  },
}

export function registerHarmonicDemo(): void {
  registerDemoBundle({
    meta: harmonicMeta,
    model: createHarmonicModel,
    adapter: createHarmonicAdapter,
  })
}
