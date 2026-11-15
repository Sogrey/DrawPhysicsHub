import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createPendulumAdapter } from './pendulumAdapter'

const G = 9.8

/**
 * 单摆小角度近似：θ = θ₀ cos(ωt)，ω = √(g/L)
 * 坐标：支点在原点，向下为 −y，θ 从竖直向下量起（逆时针为正）
 */
export function createPendulumModel(): PhysicsModel {
  let L = 1.5
  let theta0Deg = 25
  let t = 0
  let trail: number[][] = []

  function omega() {
    return Math.sqrt(G / Math.max(1e-6, L))
  }

  function period() {
    return (2 * Math.PI) / omega()
  }

  function stateAt(time: number) {
    const th0 = (theta0Deg * Math.PI) / 180
    const w = omega()
    const theta = th0 * Math.cos(w * time)
    const omegaDot = -th0 * w * Math.sin(w * time)
    const x = L * Math.sin(theta)
    const y = -L * Math.cos(theta)
    // 切向速度大小 L|dθ/dt|
    const speed = L * Math.abs(omegaDot)
    const h = y + L // 相对最低点几何高度
    // 小角简谐一致的能量（m=1）：E_p=½ g L θ²，E_k=½ L² θ̇²
    const pe = 0.5 * G * L * theta * theta
    const ke = 0.5 * L * L * omegaDot * omegaDot
    return { theta, omegaDot, x, y, speed, pe, ke, h, w }
  }

  function rebuildTrail(upto: number) {
    trail = []
    const n = Math.max(2, Math.ceil(upto / 0.02))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const { x, y } = stateAt(ti)
      trail.push([x, y])
    }
  }

  return {
    init(params: ParamValues) {
      L = Number(params.L ?? 1.5)
      theta0Deg = Number(params.theta0 ?? 25)
      t = 0
      const { x, y } = stateAt(0)
      trail = [[x, y]]
    },
    step(dt: number) {
      const T = period()
      t = Math.min(T, t + dt)
      const { x, y } = stateAt(t)
      trail.push([x, y])
    },
    seek(time: number) {
      const T = period()
      t = Math.min(T, Math.max(0, time))
      rebuildTrail(t)
    },
    observe(): ObserveSnapshot {
      const { theta, omegaDot, x, y, speed, pe, ke, h, w } = stateAt(t)
      const T = period()
      return {
        time: t,
        values: {
          x,
          y,
          theta: (theta * 180) / Math.PI,
          omega: omegaDot,
          speed,
          pe,
          ke,
          energy: pe + ke,
          height: h,
          L,
          theta0: theta0Deg,
          omega0: w,
          period: T,
          tMax: T,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
      const { x, y } = stateAt(0)
      trail = [[x, y]]
    },
    setParams(params) {
      if (params.L !== undefined) L = Number(params.L)
      if (params.theta0 !== undefined) theta0Deg = Number(params.theta0)
    },
  }
}

export const pendulumMeta: DemoMeta = {
  id: 'mech-pendulum',
  subject: '力学',
  category: '振动',
  tags: ['单摆', '简谐近似', '机械能'],
  model: 'pendulum',
  adapter: 'pendulum',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'L',
      label: '摆长 L',
      kind: 'number',
      default: 1.5,
      min: 0.5,
      max: 3,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'theta0',
      label: '最大摆角 θ₀',
      kind: 'number',
      default: 25,
      min: 5,
      max: 40,
      step: 1,
      unit: '°',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '摆动' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'theta',
      charts: [
        {
          id: 'angle',
          title: '摆角 θ(t)',
          xLabel: 't (s)',
          leftLabel: 'θ (°)',
          series: [{ key: 'theta', label: 'θ', color: '#38bdf8', unit: '°' }],
        },
        {
          id: 'energy',
          title: '机械能（m=1）',
          xLabel: 't (s)',
          leftLabel: 'E (J)',
          series: [
            { key: 'pe', label: 'Eₚ', color: '#a78bfa', unit: 'J' },
            { key: 'ke', label: 'Eₖ', color: '#4ade80', unit: 'J' },
            { key: 'energy', label: 'E', color: '#f97316', unit: 'J' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'slate' },
    { key: 'speed', label: '|v|', unit: 'm/s', tone: 'green' },
    { key: 'pe', label: 'Eₚ', unit: 'J', tone: 'purple' },
    { key: 'ke', label: 'Eₖ', unit: 'J', tone: 'amber' },
    { key: 'period', label: 'T', unit: 's', tone: 'blue' },
    { key: 'omega0', label: 'ω', unit: 'rad/s', tone: 'cyan' },
  ],
  docs: {
    title: '单摆（小角度）',
    summary:
      '小角度近似下单摆做简谐摆动：θ = θ₀ cos(√(g/L)·t)。调节摆长观察周期变化；曲线对照势能与动能互换，总机械能近似守恒。',
    concept: [
      '单摆在摆角较小时，回复力矩与角位移近似成正比，运动可化为简谐。周期 T = 2π√(L/g)，与质量、振幅无关（小角近似内）。',
      '本演示取 θ₀ ≤ 40°，仍用小角公式以便 seek 与对照；大角度需椭圆积分或数值积分，可后续扩展。',
    ],
    objectives: [
      '验证 T 随 √L 增大',
      '观察最低点动能最大、端点势能最大',
      '理解小角近似与简谐的联系',
    ],
    formulas: [
      '\\theta = \\theta_0\\cos\\sqrt{\\dfrac{g}{L}}\\, t',
      'T = 2\\pi\\sqrt{\\dfrac{L}{g}}',
      'x = L\\sin\\theta,\\quad y = -L\\cos\\theta',
    ],
    insight: '拉长 L，周期变长；在小角范围内改 θ₀ 几乎不改 T。能量图中橙色总能量应近似水平。',
    legend: [
      { color: '#f97316', label: '摆球' },
      { color: '#38bdf8', label: '轨迹' },
      { id: 'compare', color: '#f472b6', label: '对比弧' },
      { color: '#a78bfa', label: '平衡位置' },
    ],
    steps: [
      {
        id: 'shm',
        title: '小角简谐',
        body: '角加速度与 θ 成正比且反向，解为余弦。',
        formulas: ['\\ddot\\theta + \\dfrac{g}{L}\\theta = 0'],
        bindings: [
          { labelTex: 'L', valueKey: 'L', unit: 'm' },
          { labelTex: '\\theta_0', valueKey: 'theta0', unit: 'deg' },
          { labelTex: '\\omega', valueKey: 'omega0', unit: 'rad/s' },
        ],
      },
      {
        id: 'live',
        title: '瞬时状态',
        body: '拖动时间轴，对照摆角与能量分配。',
        formulas: ['E_p = mgh,\\quad E_k = \\tfrac12 mv^2'],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's' },
          { labelTex: '\\theta', valueKey: 'theta', unit: 'deg' },
          { labelTex: 'E_p', valueKey: 'pe', unit: 'J' },
          { labelTex: 'E_k', valueKey: 'ke', unit: 'J' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'period',
        title: '周期',
        body: '周期只依赖摆长与重力加速度（小角）。',
        formulas: ['T = 2\\pi\\sqrt{L/g}'],
        bindings: [{ labelTex: 'T', valueKey: 'period', unit: 's' }],
      },
    ],
    challenges: [
      {
        id: 'period-l',
        prompt: '调节 L，使周期 T ≈ 2.5 s（g=9.8）。',
        hint: 'T=2π√(L/g) ⇒ L ≈ g(T/2π)² ≈ 1.55 m。',
        check: { kind: 'valueNear', key: 'period', target: 2.5, tol: 0.1 },
      },
      {
        id: 'small-angle',
        prompt: '将 θ₀ 调到约 10°，体会小角范围。',
        hint: '小角近似在十几度内较准。',
        check: { kind: 'paramNear', key: 'theta0', target: 10, tol: 2 },
      },
    ],
  },
}

export function registerPendulumDemo(): void {
  registerDemoBundle({
    meta: pendulumMeta,
    model: createPendulumModel,
    adapter: createPendulumAdapter,
  })
}
