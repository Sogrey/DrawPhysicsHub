import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createInclineAdapter } from './inclineAdapter'

const G = 9.8

/** 斜面滑块：自顶端静止释放，a = g(sinθ − μ cosθ)（能滑时） */
export function createInclineModel(): PhysicsModel {
  let L = 5
  let thetaDeg = 30
  let mu = 0.1
  let t = 0
  let trail: number[][] = []

  function accel() {
    const th = (thetaDeg * Math.PI) / 180
    return G * (Math.sin(th) - mu * Math.cos(th))
  }

  function processEnd() {
    const a = accel()
    if (a <= 1e-9) return 1.5 // 静置示意时长
    return Math.sqrt((2 * L) / a)
  }

  function stateAt(time: number) {
    const th = (thetaDeg * Math.PI) / 180
    const a = accel()
    const sliding = a > 1e-9 ? 1 : 0
    let s = 0
    let v = 0
    if (sliding) {
      const T = processEnd()
      const tt = Math.min(time, T)
      s = Math.min(L, 0.5 * a * tt * tt)
      v = a * tt
      if (s >= L - 1e-9) {
        s = L
        v = Math.sqrt(Math.max(0, 2 * a * L))
      }
    }
    const Hx = L * Math.cos(th)
    const Hy = L * Math.sin(th)
    const x = s * Math.cos(th)
    const y = Hy - s * Math.sin(th)
    const h = y // 高度（底端 y=0）
    const pe = G * h // m=1
    const ke = 0.5 * v * v
    const workFriction = sliding ? -mu * G * Math.cos(th) * s : 0
    return { s, v, a, x, y, h, pe, ke, workFriction, sliding, Hx, Hy }
  }

  function rebuildTrail(upto: number) {
    trail = []
    const n = Math.max(2, Math.ceil(Math.max(upto, 0.01) / 0.02))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const st = stateAt(ti)
      trail.push([st.x, st.y])
    }
  }

  return {
    init(params: ParamValues) {
      L = Number(params.L ?? 5)
      thetaDeg = Number(params.theta ?? 30)
      mu = Number(params.mu ?? 0.1)
      t = 0
      const st = stateAt(0)
      trail = [[st.x, st.y]]
    },
    step(dt: number) {
      const T = processEnd()
      t = Math.min(T, t + dt)
      const st = stateAt(t)
      trail.push([st.x, st.y])
    },
    seek(time: number) {
      const T = processEnd()
      t = Math.min(T, Math.max(0, time))
      rebuildTrail(t)
    },
    observe(): ObserveSnapshot {
      const st = stateAt(t)
      const T = processEnd()
      const th = (thetaDeg * Math.PI) / 180
      return {
        time: t,
        values: {
          s: st.s,
          v: st.v,
          a: st.a,
          x: st.x,
          y: st.y,
          pe: st.pe,
          ke: st.ke,
          energy: st.pe + st.ke,
          workFriction: st.workFriction,
          L,
          theta: thetaDeg,
          mu,
          N: G * Math.cos(th),
          sliding: st.sliding,
          tMax: T,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
      const st = stateAt(0)
      trail = [[st.x, st.y]]
    },
    setParams(params) {
      if (params.L !== undefined) L = Number(params.L)
      if (params.theta !== undefined) thetaDeg = Number(params.theta)
      if (params.mu !== undefined) mu = Number(params.mu)
    },
  }
}

export const inclineMeta: DemoMeta = {
  id: 'mech-incline',
  subject: '力学',
  category: '牛顿定律',
  tags: ['斜面', '摩擦', '动能定理'],
  model: 'incline',
  adapter: 'incline',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'theta',
      label: '倾角 θ',
      kind: 'number',
      default: 30,
      min: 10,
      max: 60,
      step: 1,
      unit: '°',
    },
    {
      key: 'mu',
      label: '动摩擦 μ',
      kind: 'number',
      default: 0.1,
      min: 0,
      max: 0.8,
      step: 0.05,
    },
    {
      key: 'L',
      label: '斜面长 L',
      kind: 'number',
      default: 5,
      min: 2,
      max: 10,
      step: 0.5,
      unit: 'm',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '斜面' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 's',
      charts: [
        {
          id: 'motion',
          title: '路程与速度',
          xLabel: 't (s)',
          leftLabel: 's (m)',
          rightLabel: 'v (m/s)',
          series: [
            { key: 's', label: 's', color: '#38bdf8', unit: 'm', axis: 'left' },
            { key: 'v', label: 'v', color: '#4ade80', unit: 'm/s', axis: 'right' },
          ],
        },
        {
          id: 'energy',
          title: '能量（m=1）',
          xLabel: 't (s)',
          leftLabel: 'E (J)',
          series: [
            { key: 'pe', label: 'Eₚ', color: '#a78bfa', unit: 'J' },
            { key: 'ke', label: 'Eₖ', color: '#4ade80', unit: 'J' },
            { key: 'energy', label: 'Eₚ+Eₖ', color: '#f97316', unit: 'J' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 's', label: 's', unit: 'm', tone: 'slate' },
    { key: 'v', label: 'v', unit: 'm/s', tone: 'green' },
    { key: 'a', label: 'a', unit: 'm/s²', tone: 'blue' },
    { key: 'pe', label: 'Eₚ', unit: 'J', tone: 'purple' },
    { key: 'ke', label: 'Eₖ', unit: 'J', tone: 'amber' },
    { key: 'workFriction', label: 'W_f', unit: 'J', tone: 'cyan' },
  ],
  docs: {
    title: '斜面滑块',
    summary:
      '滑块自斜面顶端静止释放。加速度 a = g(sinθ − μ cosθ)；μ 过大则不下滑。对照路程、速度与机械能（摩擦做负功使 Eₚ+Eₖ 减少）。',
    concept: [
      '沿斜面方向：重力分力 mg sinθ 与摩擦力 μ N = μ mg cosθ 决定加速度。当 μ ≥ tanθ 时静摩擦可阻止下滑（本演示用同一 μ 作动摩擦阈值）。',
      '无摩擦时机械能守恒；有摩擦时机械能耗散为摩擦热，读数 W_f 为摩擦力做功（负值）。',
    ],
    objectives: [
      '写出斜面加速度公式并与读数对照',
      '观察 μ、θ 对能否下滑与到达时间的影响',
      '理解摩擦导致机械能不守恒',
    ],
    formulas: [
      'a = g(\\sin\\theta - \\mu\\cos\\theta)',
      's = \\tfrac12 a t^2',
      'v^2 = 2 a s',
    ],
    insight: '增大 θ 或减小 μ 会更快到底。橙色 Eₚ+Eₖ 随摩擦下降；μ=0 时应近似水平。',
    legend: [
      { color: '#38bdf8', label: '滑块 / 轨迹' },
      { id: 'compare', color: '#f472b6', label: '斜面全长' },
      { color: '#4ade80', label: '速度方向' },
    ],
    steps: [
      {
        id: 'force',
        title: '沿斜面受力',
        body: '取沿斜面向下为正。',
        formulas: ['a = g(\\sin\\theta - \\mu\\cos\\theta)'],
        bindings: [
          { labelTex: '\\theta', valueKey: 'theta', unit: 'deg' },
          { labelTex: '\\mu', valueKey: 'mu' },
          { labelTex: 'a', valueKey: 'a', unit: 'm/s^2' },
        ],
      },
      {
        id: 'motion',
        title: '运动学',
        body: '初速为零的匀加速直线运动。',
        formulas: ['s = \\tfrac12 a t^2', 'v = a t'],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's' },
          { labelTex: 's', valueKey: 's', unit: 'm' },
          { labelTex: 'v', valueKey: 'v', unit: 'm/s' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'energy',
        title: '能量',
        body: '摩擦做负功，机械能减少。',
        formulas: ['W_f = -\\mu mg\\cos\\theta\\cdot s'],
        bindings: [
          { labelTex: 'E_p', valueKey: 'pe', unit: 'J' },
          { labelTex: 'E_k', valueKey: 'ke', unit: 'J' },
          { labelTex: 'W_f', valueKey: 'workFriction', unit: 'J' },
        ],
      },
    ],
    challenges: [
      {
        id: 'smooth',
        prompt: '令 μ=0、θ=30°，观察 Eₚ+Eₖ 是否近似守恒。',
        hint: '把摩擦拖到 0。',
        check: { kind: 'paramNear', key: 'mu', target: 0, tol: 0.02 },
      },
      {
        id: 'stuck',
        prompt: '调节 μ 与 θ，使滑块不下滑（提示：μ ≥ tanθ）。',
        hint: '例如 θ=30° 时 tan30°≈0.58，把 μ 调到 0.6 以上。',
        check: { kind: 'valueNear', key: 'sliding', target: 0, tol: 0.1 },
      },
    ],
  },
}

export function registerInclineDemo(): void {
  registerDemoBundle({
    meta: inclineMeta,
    model: createInclineModel,
    adapter: createInclineAdapter,
  })
}
