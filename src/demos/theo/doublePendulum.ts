import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createDoublePendulumAdapter } from './doublePendulumAdapter'

const G = 9.8

/** 双摆角加速度（θ 从竖直向下量起）。返回 [ω1', ω2'] */
export function doublePendulumAccels(
  th1: number,
  th2: number,
  w1: number,
  w2: number,
  L1: number,
  L2: number,
  m1: number,
  m2: number,
): [number, number] {
  const d = th1 - th2
  const den = 2 * m1 + m2 - m2 * Math.cos(2 * d)
  const denSafe = Math.max(1e-6, Math.abs(den)) * Math.sign(den || 1)
  const w1p =
    (-G * (2 * m1 + m2) * Math.sin(th1) -
      m2 * G * Math.sin(th1 - 2 * th2) -
      2 * Math.sin(d) * m2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d))) /
    (L1 * denSafe)
  const w2p =
    (2 *
      Math.sin(d) *
      (w1 * w1 * L1 * (m1 + m2) + G * (m1 + m2) * Math.cos(th1) + w2 * w2 * L2 * m2 * Math.cos(d))) /
    (L2 * denSafe)
  return [w1p, w2p]
}

function rk4Step(
  th1: number,
  th2: number,
  w1: number,
  w2: number,
  h: number,
  L1: number,
  L2: number,
  m1: number,
  m2: number,
) {
  const f = (a: number, b: number, c: number, d: number) => {
    const [ap, bp] = doublePendulumAccels(a, b, c, d, L1, L2, m1, m2)
    return [c, d, ap, bp] as const
  }
  const k1 = f(th1, th2, w1, w2)
  const k2 = f(th1 + 0.5 * h * k1[0], th2 + 0.5 * h * k1[1], w1 + 0.5 * h * k1[2], w2 + 0.5 * h * k1[3])
  const k3 = f(th1 + 0.5 * h * k2[0], th2 + 0.5 * h * k2[1], w1 + 0.5 * h * k2[2], w2 + 0.5 * h * k2[3])
  const k4 = f(th1 + h * k3[0], th2 + h * k3[1], w1 + h * k3[2], w2 + h * k3[3])
  return {
    th1: th1 + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    th2: th2 + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    w1: w1 + (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    w2: w2 + (h / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
  }
}

export function createDoublePendulumModel(): PhysicsModel {
  let L1 = 1.2
  let L2 = 1.0
  let m1 = 1
  let m2 = 1
  let th10 = 120
  let th20 = -10
  let t = 0
  const period = 12
  let trail2: number[][] = []

  function integrateTo(time: number) {
    let th1 = (th10 * Math.PI) / 180
    let th2 = (th20 * Math.PI) / 180
    let w1 = 0
    let w2 = 0
    trail2 = []
    const dt = 1 / 240
    const T = Math.min(period, Math.max(0, time))
    let tau = 0
    const push = () => {
      const x1 = L1 * Math.sin(th1)
      const y1 = -L1 * Math.cos(th1)
      const x2 = x1 + L2 * Math.sin(th2)
      const y2 = y1 - L2 * Math.cos(th2)
      if (trail2.length % 2 === 0) trail2.push([x2, y2])
      return { x1, y1, x2, y2, th1, th2, w1, w2 }
    }
    let s = push()
    while (tau < T - 1e-12) {
      const h = Math.min(dt, T - tau)
      const n = rk4Step(th1, th2, w1, w2, h, L1, L2, m1, m2)
      th1 = n.th1
      th2 = n.th2
      w1 = n.w1
      w2 = n.w2
      tau += h
      s = push()
    }
    trail2.push([s.x2, s.y2])
    // energy (m g h with y up from pivot; pivot at 0)
    const pe = m1 * G * s.y1 + m2 * G * s.y2
    const v1x = L1 * w1 * Math.cos(th1)
    const v1y = L1 * w1 * Math.sin(th1)
    const v2x = v1x + L2 * w2 * Math.cos(th2)
    const v2y = v1y + L2 * w2 * Math.sin(th2)
    const ke = 0.5 * m1 * (v1x * v1x + v1y * v1y) + 0.5 * m2 * (v2x * v2x + v2y * v2y)
    return { ...s, pe, ke, E: pe + ke }
  }

  return {
    init(params: ParamValues) {
      L1 = Number(params.L1 ?? 1.2)
      L2 = Number(params.L2 ?? 1.0)
      m1 = Number(params.m1 ?? 1)
      m2 = Number(params.m2 ?? 1)
      th10 = Number(params.th1 ?? 120)
      th20 = Number(params.th2 ?? -10)
      t = 0
      integrateTo(0)
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const s = integrateTo(t)
      const world = L1 + L2 + 0.6
      return {
        time: t,
        values: {
          L1,
          L2,
          m1,
          m2,
          th1: (s.th1 * 180) / Math.PI,
          th2: (s.th2 * 180) / Math.PI,
          w1: s.w1,
          w2: s.w2,
          x1: s.x1,
          y1: s.y1,
          x2: s.x2,
          y2: s.y2,
          pe: s.pe,
          ke: s.ke,
          E: s.E,
          period,
          tMax: period,
          world,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: trail2.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.L1 !== undefined) L1 = Number(params.L1)
      if (params.L2 !== undefined) L2 = Number(params.L2)
      if (params.m1 !== undefined) m1 = Number(params.m1)
      if (params.m2 !== undefined) m2 = Number(params.m2)
      if (params.th1 !== undefined) th10 = Number(params.th1)
      if (params.th2 !== undefined) th20 = Number(params.th2)
    },
  }
}

export const doublePendulumMeta: DemoMeta = {
  id: 'theo-double-pendulum',
  subject: '理论力学',
  category: '分析力学',
  tags: ['双摆', '混沌', '数值积分'],
  model: 'doublePendulum',
  adapter: 'doublePendulum',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'L1', label: 'L₁', kind: 'number', default: 1.2, min: 0.6, max: 1.8, step: 0.1, unit: '' },
    { key: 'L2', label: 'L₂', kind: 'number', default: 1.0, min: 0.5, max: 1.6, step: 0.1, unit: '' },
    { key: 'm1', label: 'm₁', kind: 'number', default: 1, min: 0.5, max: 2, step: 0.1, unit: '' },
    { key: 'm2', label: 'm₂', kind: 'number', default: 1, min: 0.5, max: 2, step: 0.1, unit: '' },
    { key: 'th1', label: 'θ₁(0)', kind: 'number', default: 120, min: -170, max: 170, step: 5, unit: '°' },
    { key: 'th2', label: 'θ₂(0)', kind: 'number', default: -10, min: -170, max: 170, step: 5, unit: '°' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '双摆' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '能量',
      chartKey: 'E',
      charts: [
        {
          id: 'energy',
          title: '动能 / 势能',
          xLabel: 't (s)',
          leftLabel: 'E',
          series: [
            { key: 'ke', label: 'K', color: '#38bdf8', unit: '' },
            { key: 'pe', label: 'U', color: '#fbbf24', unit: '' },
            { key: 'E', label: 'E', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'th1', label: 'θ₁', unit: '°', tone: 'amber' },
    { key: 'th2', label: 'θ₂', unit: '°', tone: 'purple' },
    { key: 'ke', label: 'K', unit: '', tone: 'blue' },
    { key: 'E', label: 'E', unit: '', tone: 'green' },
  ],
  docs: {
    title: '双摆数值与混沌示意',
    summary:
      '等质量双摆用 RK4 积分拉格朗日方程。大角度初态对微扰敏感：末球轨迹可呈混沌缠绕。播放看 θ₁、θ₂ 与能量。',
    concept: [
      '双摆是典型低维混沌系统：对初值敏感',
      '能量近似守恒（数值截断误差可见）',
      '分析力学：广义坐标 θ₁、θ₂，无约束力显式出现',
    ],
    objectives: ['观察末球轨迹缠绕', '对照动能/势能交换', '微改 θ₂(0) 看路径分叉（课堂对比）'],
    formulas: [
      'L=T-V',
      '\\frac{d}{dt}\\frac{\\partial L}{\\partial\\dot\\theta_i}=\\frac{\\partial L}{\\partial\\theta_i}',
    ],
    insight: '金=上摆，青=下摆；黄轨迹=下摆端点。大角度（默认 θ₁≈120°）更易见混沌。',
    legend: [
      { color: '#fbbf24', label: '上摆 / 轨迹' },
      { color: '#38bdf8', label: '下摆' },
      { color: '#a78bfa', label: '总能量 E' },
    ],
    steps: [
      {
        id: 'chaos',
        title: '初值敏感',
        body: '略改 θ₂(0)，复位播放，对比末球轨迹。',
        formulas: [],
        bindings: [
          { labelTex: '\\theta_1', valueKey: 'th1', unit: '°' },
          { labelTex: '\\theta_2', valueKey: 'th2', unit: '°' },
        ],
      },
      {
        id: 'energy',
        title: '能量',
        body: '看曲线：K 与 U 交换，E 近似常数。',
        formulas: ['E=K+U'],
        bindings: [
          { labelTex: 'K', valueKey: 'ke', unit: '' },
          { labelTex: 'E', valueKey: 'E', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'hang',
        prompt: '取 θ₁(0)≈120°、θ₂(0)≈−10°，播放使下摆转过较大角度。',
        hint: '默认参数即可；观察 |θ₂| 变化。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'th1', target: 120, tol: 25 },
            { kind: 'valueNear', key: 't', target: 2, tol: 10 },
          ],
        },
      },
    ],
  },
}

export function registerDoublePendulumDemo(): void {
  registerDemoBundle({
    meta: doublePendulumMeta,
    model: createDoublePendulumModel,
    adapter: createDoublePendulumAdapter,
  })
}
