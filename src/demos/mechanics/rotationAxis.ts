import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createRotationAxisAdapter } from './rotationAxisAdapter'

/**
 * 定轴转动（圆盘绕固定中心 O）：
 *   θ(t) = ω₀ t + ½ α t² ， ω(t) = ω₀ + α t
 *   I = ½ m R²（实心圆盘）， τ = I α
 *   轮缘点：v = ω R，aₜ = α R，aₙ = ω² R
 */
export function createRotationAxisModel(): PhysicsModel {
  let R = 1.5
  let omega0 = 1.2
  let alpha = 0.4
  let m = 2
  let t = 0
  let trailRim: number[][] = []

  function Idisk() {
    return 0.5 * m * R * R
  }

  function processEnd() {
    const target = 4 * Math.PI // 约两圈
    if (Math.abs(alpha) < 1e-12) {
      return target / Math.max(1e-9, Math.abs(omega0))
    }
    // ½ α t² + ω₀ t − target = 0
    const A = 0.5 * alpha
    const B = omega0
    const C = -target
    const disc = B * B - 4 * A * C
    if (disc < 0) return 8
    const s = Math.sqrt(disc)
    const t1 = (-B + s) / (2 * A)
    const t2 = (-B - s) / (2 * A)
    const ok = [t1, t2].filter((x) => x > 0.05)
    return ok.length ? Math.min(...ok) : 8
  }

  function stateAt(time: number) {
    const theta = omega0 * time + 0.5 * alpha * time * time
    const omega = omega0 + alpha * time
    // 轮缘标记：初始在右侧 (R, 0)
    const rimX = R * Math.cos(theta)
    const rimY = R * Math.sin(theta)
    const speed = Math.abs(omega) * R
    const at = alpha * R
    const an = omega * omega * R
    // 切向方向（θ 增大为逆时针）：ê_t = (−sin θ, cos θ) * sign(ω) for velocity direction
    const etx = -Math.sin(theta)
    const ety = Math.cos(theta)
    const vx = omega * R * etx // ω>0 → 逆时针
    const vy = omega * R * ety
    const I = Idisk()
    const tau = I * alpha
    const K = 0.5 * I * omega * omega
    return {
      theta,
      omega,
      rimX,
      rimY,
      speed,
      at,
      an,
      vx,
      vy,
      etx,
      ety,
      I,
      tau,
      K,
    }
  }

  function rebuildTrail(upto: number) {
    trailRim = []
    const n = Math.max(2, Math.ceil(upto / 0.02))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const s = stateAt(ti)
      trailRim.push([s.rimX, s.rimY])
    }
  }

  return {
    init(params: ParamValues) {
      R = Number(params.R ?? 1.5)
      omega0 = Number(params.omega0 ?? 1.2)
      alpha = Number(params.alpha ?? 0.4)
      m = Number(params.m ?? 2)
      t = 0
      const s = stateAt(0)
      trailRim = [[s.rimX, s.rimY]]
    },
    step(dt: number) {
      const T = processEnd()
      t = Math.min(T, t + dt)
      const s = stateAt(t)
      trailRim.push([s.rimX, s.rimY])
    },
    seek(time: number) {
      const T = processEnd()
      t = Math.min(T, Math.max(0, time))
      rebuildTrail(t)
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      const T = processEnd()
      return {
        time: t,
        values: {
          R,
          m,
          omega0,
          alpha,
          omega: s.omega,
          theta: (s.theta * 180) / Math.PI,
          thetaRad: s.theta,
          rimX: s.rimX,
          rimY: s.rimY,
          vx: s.vx,
          vy: s.vy,
          speed: s.speed,
          at: s.at,
          an: s.an,
          I: s.I,
          tau: s.tau,
          K: s.K,
          checkV: s.speed - Math.abs(s.omega) * R,
          tMax: T,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: { path: trailRim.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
      const s = stateAt(0)
      trailRim = [[s.rimX, s.rimY]]
    },
    setParams(params) {
      if (params.R !== undefined) R = Number(params.R)
      if (params.omega0 !== undefined) omega0 = Number(params.omega0)
      if (params.alpha !== undefined) alpha = Number(params.alpha)
      if (params.m !== undefined) m = Number(params.m)
    },
  }
}

export const rotationAxisMeta: DemoMeta = {
  id: 'mech-rotation-axis',
  subject: '力学',
  category: '刚体力学',
  tags: ['角速度', '刚体', '定轴转动', '角加速度'],
  model: 'rotationAxis',
  adapter: 'rotationAxis',
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
      default: 1.5,
      min: 0.6,
      max: 3,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'omega0',
      label: '初角速度 ω₀',
      kind: 'number',
      default: 1.2,
      min: 0.2,
      max: 3,
      step: 0.1,
      unit: 'rad/s',
    },
    {
      key: 'alpha',
      label: '角加速度 α',
      kind: 'number',
      default: 0.4,
      min: -1.5,
      max: 1.5,
      step: 0.1,
      unit: 'rad/s²',
    },
    {
      key: 'm',
      label: '质量 m',
      kind: 'number',
      default: 2,
      min: 0.5,
      max: 8,
      step: 0.5,
      unit: 'kg',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '圆盘' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'omega',
      charts: [
        {
          id: 'ang',
          title: '角速度 / 角位移',
          xLabel: 't (s)',
          leftLabel: 'ω (rad/s)',
          rightLabel: 'θ (rad)',
          series: [
            { key: 'omega', label: 'ω', color: '#38bdf8', unit: 'rad/s' },
            { key: 'thetaRad', label: 'θ', color: '#fbbf24', unit: 'rad', axis: 'right' },
          ],
        },
        {
          id: 'rim',
          title: '轮缘线速度与加速度',
          xLabel: 't (s)',
          leftLabel: 'v, a',
          series: [
            { key: 'speed', label: '|v|', color: '#22d3ee', unit: 'm/s' },
            { key: 'at', label: 'aₜ', color: '#4ade80', unit: 'm/s²' },
            { key: 'an', label: 'aₙ', color: '#f472b6', unit: 'm/s²' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'omega', label: 'ω', unit: 'rad/s', tone: 'blue' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'amber' },
    { key: 'speed', label: '|v|', unit: 'm/s', tone: 'green' },
    { key: 'tau', label: 'τ', unit: 'N·m', tone: 'purple' },
    { key: 'K', label: 'K', unit: 'J', tone: 'slate' },
  ],
  docs: {
    title: '定轴转动',
    summary:
      '刚体圆盘绕固定轴 O 转动。观察角量 θ、ω、α 与轮缘线速度 v=ωR，以及力矩 τ=Iα、转动动能。',
    concept: [
      '定轴转动用角位移 θ、角速度 ω、角加速度 α 描述；线量与角量由半径联系：v=ωR，aₜ=αR，aₙ=ω²R。',
      '对固定轴，转动定律 τ = I α。实心圆盘 I = ½ m R²。',
      '匀角加速时 ω=ω₀+αt，θ=ω₀t+½αt²，与一维平动公式同构。',
    ],
    objectives: [
      '辨认轴、轮缘标记点与角速度方向',
      '验证 v=ωR、τ=Iα',
      '对比 α=0（匀速转动）与 α≠0 的差异',
    ],
    formulas: [
      '\\omega = \\omega_0 + \\alpha t',
      '\\theta = \\omega_0 t + \\tfrac12 \\alpha t^2',
      'v = \\omega R,\\quad \\tau = I\\alpha,\\quad I=\\tfrac12 m R^2',
    ],
    insight:
      '青点为轮缘标记；绿箭头为线速度 v（切向）。调 α=0 可看匀速转动；读数 τ 应等于 Iα。',
    legend: [
      { color: '#38bdf8', label: '轮缘轨迹' },
      { id: 'compare', color: '#f472b6', label: '圆盘外缘对比' },
      { color: '#4ade80', label: '线速度 v' },
      { color: '#a78bfa', label: '半径 / 转轴 O' },
    ],
    steps: [
      {
        id: 'ang',
        title: '角运动学',
        body: '类比一维匀变速：ω、θ 由 ω₀ 与 α 决定。',
        formulas: ['\\omega=\\omega_0+\\alpha t', '\\theta=\\omega_0 t+\\tfrac12\\alpha t^2'],
        bindings: [
          { labelTex: '\\omega_0', valueKey: 'omega0', unit: 'rad/s' },
          { labelTex: '\\alpha', valueKey: 'alpha', unit: 'rad/s^2' },
          { labelTex: '\\omega', valueKey: 'omega', unit: 'rad/s' },
          { labelTex: '\\theta', valueKey: 'theta', unit: '\\circ' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'rim',
        title: '轮缘线量',
        body: '距轴 R 处的质点：切向速度与加速度由角量给出。',
        formulas: ['v=\\omega R', 'a_t=\\alpha R', 'a_n=\\omega^2 R'],
        bindings: [
          { labelTex: 'R', valueKey: 'R', unit: 'm' },
          { labelTex: '|v|', valueKey: 'speed', unit: 'm/s' },
          { labelTex: 'a_t', valueKey: 'at', unit: 'm/s^2' },
          { labelTex: 'a_n', valueKey: 'an', unit: 'm/s^2' },
        ],
      },
      {
        id: 'torque',
        title: '转动定律',
        body: '实心圆盘对中心轴 I=½mR²，外力矩 τ=Iα。',
        formulas: ['I=\\tfrac12 m R^2', '\\tau=I\\alpha', 'K=\\tfrac12 I\\omega^2'],
        bindings: [
          { labelTex: 'm', valueKey: 'm', unit: 'kg' },
          { labelTex: 'I', valueKey: 'I', unit: 'kg\\cdot m^2' },
          { labelTex: '\\tau', valueKey: 'tau', unit: 'N\\cdot m' },
          { labelTex: 'K', valueKey: 'K', unit: 'J' },
        ],
      },
    ],
    challenges: [
      {
        id: 'uniform',
        prompt: '令 α=0，使转动为匀速（aₜ≈0）。',
        hint: '把角加速度滑到 0。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'alpha', target: 0, tol: 0.05 },
            { kind: 'valueNear', key: 'at', target: 0, tol: 0.12 },
          ],
        },
      },
      {
        id: 'v-omega-R',
        prompt: '任意时刻验证 |v| ≈ |ω| R（残差 checkV≈0）。',
        hint: '由定义保证；读数 checkV 应接近 0。',
        check: { kind: 'valueNear', key: 'checkV', target: 0, tol: 0.08 },
      },
      {
        id: 'tau-I-alpha',
        prompt: '取 m=2、R=2、α=0.5，使 τ ≈ 2 N·m。',
        hint: 'I=½mR²=4，τ=Iα=2。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'm', target: 2, tol: 0.08 },
            { kind: 'paramNear', key: 'R', target: 2, tol: 0.08 },
            { kind: 'paramNear', key: 'alpha', target: 0.5, tol: 0.08 },
            { kind: 'valueNear', key: 'tau', target: 2, tol: 0.2 },
          ],
        },
      },
    ],
  },
}

export function registerRotationAxisDemo(): void {
  registerDemoBundle({
    meta: rotationAxisMeta,
    model: createRotationAxisModel,
    adapter: createRotationAxisAdapter,
  })
}
