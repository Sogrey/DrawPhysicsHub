import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createRollingAdapter } from './rollingAdapter'

/**
 * 水平面匀速无滑滚动（右侧为正）：
 *   v = ω R  ⇒  ω = v/R
 *   x_cm = v t ， θ = −(v/R) t（顺时针为负，与常见 2D 约定一致）
 *   I = κ m R² ， K = ½ m v² (1+κ)
 */
export function createRollingModel(): PhysicsModel {
  let R = 1
  let v = 1.5
  let m = 1
  let kappa = 0.5 // 圆盘
  let t = 0
  let trailCm: number[][] = []
  let trailRim: number[][] = []

  function omega() {
    return v / Math.max(1e-9, R)
  }

  function processEnd() {
    // 滚过约 4 圈
    return (8 * Math.PI * R) / Math.max(1e-9, v)
  }

  function stateAt(time: number) {
    const w = omega()
    const x = v * time
    const theta = -w * time // 向右滚 → 顺时针
    const y = R
    // 轮缘标记点（初始在底部接触点）
    const rimX = x + R * Math.sin(theta)
    const rimY = y - R * Math.cos(theta)
    const I = kappa * m * R * R
    const Ktr = 0.5 * m * v * v
    const Krot = 0.5 * I * w * w
    return { x, y, theta, w, rimX, rimY, I, Ktr, Krot, K: Ktr + Krot }
  }

  function rebuildTrails(upto: number) {
    trailCm = []
    trailRim = []
    const n = Math.max(2, Math.ceil(upto / 0.02))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const s = stateAt(ti)
      trailCm.push([s.x, s.y])
      trailRim.push([s.rimX, s.rimY])
    }
  }

  return {
    init(params: ParamValues) {
      R = Number(params.R ?? 1)
      v = Number(params.v ?? 1.5)
      m = Number(params.m ?? 1)
      kappa = Number(params.kappa ?? 0.5)
      t = 0
      const s = stateAt(0)
      trailCm = [[s.x, s.y]]
      trailRim = [[s.rimX, s.rimY]]
    },
    step(dt: number) {
      const T = processEnd()
      t = Math.min(T, t + dt)
      const s = stateAt(t)
      trailCm.push([s.x, s.y])
      trailRim.push([s.rimX, s.rimY])
    },
    seek(time: number) {
      const T = processEnd()
      t = Math.min(T, Math.max(0, time))
      rebuildTrails(t)
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      const T = processEnd()
      const w = s.w
      return {
        time: t,
        values: {
          x: s.x,
          y: s.y,
          vx: v,
          omega: w,
          theta: (s.theta * 180) / Math.PI,
          R,
          v,
          m,
          kappa,
          I: s.I,
          Ktr: s.Ktr,
          Krot: s.Krot,
          K: s.K,
          check: v - w * R, // 无滑约束残差 ≈ 0
          rimX: s.rimX,
          rimY: s.rimY,
          period: (2 * Math.PI) / Math.max(1e-9, w),
          tMax: T,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: {
          path: trailCm.map((p) => [...p]),
          rim: trailRim.map((p) => [...p]),
        },
      }
    },
    reset() {
      t = 0
      const s = stateAt(0)
      trailCm = [[s.x, s.y]]
      trailRim = [[s.rimX, s.rimY]]
    },
    setParams(params) {
      if (params.R !== undefined) R = Number(params.R)
      if (params.v !== undefined) v = Number(params.v)
      if (params.m !== undefined) m = Number(params.m)
      if (params.kappa !== undefined) kappa = Number(params.kappa)
    },
  }
}

export const rollingMeta: DemoMeta = {
  id: 'mech-rolling',
  subject: '力学',
  category: '刚体力学',
  tags: ['无滑滚动', '刚体', '转动动能'],
  model: 'rolling',
  adapter: 'rolling',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'R',
      label: '半径 R',
      kind: 'number',
      default: 1,
      min: 0.4,
      max: 2,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'v',
      label: '质心速率 v',
      kind: 'number',
      default: 1.5,
      min: 0.4,
      max: 3.5,
      step: 0.1,
      unit: 'm/s',
    },
    {
      key: 'm',
      label: '质量 m',
      kind: 'number',
      default: 1,
      min: 0.5,
      max: 5,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'kappa',
      label: '惯量系数 κ (I=κmR²)',
      kind: 'number',
      default: 0.5,
      min: 0.3,
      max: 1,
      step: 0.05,
      unit: '',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '滚动' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'x',
      charts: [
        {
          id: 'pos',
          title: '质心位置 x(t)',
          xLabel: 't (s)',
          leftLabel: 'x (m)',
          series: [{ key: 'x', label: 'x_cm', color: '#38bdf8', unit: 'm' }],
        },
        {
          id: 'energy',
          title: '平动 / 转动 / 总动能',
          xLabel: 't (s)',
          leftLabel: 'K (J)',
          series: [
            { key: 'Ktr', label: 'K_平', color: '#4ade80', unit: 'J' },
            { key: 'Krot', label: 'K_转', color: '#a78bfa', unit: 'J' },
            { key: 'K', label: 'K_总', color: '#fbbf24', unit: 'J' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'x', label: 'x_cm', unit: 'm', tone: 'slate' },
    { key: 'v', label: 'v', unit: 'm/s', tone: 'green' },
    { key: 'omega', label: 'ω', unit: 'rad/s', tone: 'blue' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'amber' },
    { key: 'Ktr', label: 'K_平', unit: 'J', tone: 'green' },
    { key: 'Krot', label: 'K_转', unit: 'J', tone: 'purple' },
    { key: 'K', label: 'K_总', unit: 'J', tone: 'cyan' },
  ],
  docs: {
    title: '无滑滚动（平面）',
    summary:
      '匀速无滑滚动：质心平动与绕质心转动由约束 v = ωR 锁定。轮缘一点画出摆线；动能按 κ 在平动与转动间分配。κ=1/2 圆盘，κ=1 细环，κ=2/5 实心球。',
    concept: [
      '无滑动意味着接触点相对地面瞬时速度为零，因此质心速率与角速度满足 v = ωR。',
      '总动能 = 平动动能 + 绕质心转动动能。惯量写成 I = κ m R²，则 K_转 / K_平 = κ，与速率无关。',
    ],
    objectives: [
      '掌握无滑约束 v = ωR',
      '观察轮缘点的摆线轨迹',
      '理解 κ 如何改变转动动能占比',
    ],
    formulas: [
      'v = \\omega R',
      'x_{\\mathrm{cm}} = v t,\\quad \\theta = -\\dfrac{v}{R}t',
      'I = \\kappa m R^2',
      'K = \\tfrac12 m v^2 + \\tfrac12 I\\omega^2 = \\tfrac12 m v^2(1+\\kappa)',
    ],
    insight: '匀速滚动时静摩擦不做功（接触点无滑动），机械能守恒；本演示直接给匀速运动学，突出约束与能量分配。',
    legend: [
      { color: '#38bdf8', label: '质心轨迹' },
      { color: '#fbbf24', label: '轮缘点（摆线）' },
      { id: 'compare', color: '#f472b6', label: '纯滑动同速质心' },
      { color: '#4ade80', label: '质心速度' },
      { color: '#a78bfa', label: '角速度示意' },
    ],
    steps: [
      {
        id: 'constraint',
        title: '无滑约束',
        body: '接触点相对地面速度为零 ⇔ v = ωR。',
        formulas: ['v = \\omega R'],
        bindings: [
          { labelTex: 'v', valueKey: 'v', unit: 'm/s' },
          { labelTex: '\\omega', valueKey: 'omega', unit: 'rad/s' },
          { labelTex: 'R', valueKey: 'R', unit: 'm' },
          { labelTex: 'v-\\omega R', valueKey: 'check', unit: 'm/s', digits: 3 },
        ],
      },
      {
        id: 'kinematics',
        title: '运动学',
        body: '质心匀速前进，转角与路程成正比。',
        formulas: ['x_{\\mathrm{cm}} = vt', '\\theta = -(v/R)t'],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's' },
          { labelTex: 'x', valueKey: 'x', unit: 'm' },
          { labelTex: '\\theta', valueKey: 'theta', unit: '°' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'energy',
        title: '能量分配',
        body: 'K_转 / K_平 = κ；调大 κ（更接近细环）转动份额增大。',
        formulas: ['K = \\tfrac12 mv^2(1+\\kappa)'],
        bindings: [
          { labelTex: '\\kappa', valueKey: 'kappa' },
          { labelTex: 'K_\\mathrm{tr}', valueKey: 'Ktr', unit: 'J' },
          { labelTex: 'K_\\mathrm{rot}', valueKey: 'Krot', unit: 'J' },
          { labelTex: 'K', valueKey: 'K', unit: 'J' },
        ],
      },
    ],
    challenges: [
      {
        id: 'disk',
        prompt: '把 κ 设为 0.5（圆盘），确认 K_转 ≈ ½ K_平。',
        hint: '读数中 K_转 应约为 K_平 的一半。',
        check: { kind: 'paramNear', key: 'kappa', target: 0.5, tol: 0.03 },
      },
      {
        id: 'hoop',
        prompt: '把 κ 调到 1.0（细环），观察 K_转 升到与 K_平 相当。',
        hint: '细环全部质量在边缘，转动动能占比最大。',
        check: { kind: 'paramNear', key: 'kappa', target: 1, tol: 0.05 },
      },
    ],
  },
}

export function registerRollingDemo(): void {
  registerDemoBundle({
    meta: rollingMeta,
    model: createRollingModel,
    adapter: createRollingAdapter,
  })
}
