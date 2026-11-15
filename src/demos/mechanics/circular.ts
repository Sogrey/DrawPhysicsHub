import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCircularAdapter } from './circularAdapter'

/** 匀速圆周：r = R(cos ωt, sin ωt)，逆时针 */
export function createCircularModel(): PhysicsModel {
  let R = 2
  let omega = 1.5
  let t = 0
  let trail: number[][] = []

  function period() {
    return (2 * Math.PI) / Math.max(1e-9, omega)
  }

  function stateAt(time: number) {
    const th = omega * time
    const x = R * Math.cos(th)
    const y = R * Math.sin(th)
    const vx = -R * omega * Math.sin(th)
    const vy = R * omega * Math.cos(th)
    const ax = -R * omega * omega * Math.cos(th)
    const ay = -R * omega * omega * Math.sin(th)
    return { x, y, vx, vy, ax, ay, th }
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
      R = Number(params.R ?? 2)
      omega = Number(params.omega ?? 1.5)
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
      const { x, y, vx, vy, ax, ay, th } = stateAt(t)
      const T = period()
      const speed = R * omega
      const an = omega * omega * R
      return {
        time: t,
        values: {
          x,
          y,
          vx,
          vy,
          ax,
          ay,
          speed,
          an,
          R,
          omega,
          theta: (th * 180) / Math.PI,
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
      if (params.R !== undefined) R = Number(params.R)
      if (params.omega !== undefined) omega = Number(params.omega)
    },
  }
}

export const circularMeta: DemoMeta = {
  id: 'mech-circular',
  subject: '力学',
  category: '质点运动学',
  tags: ['圆周运动', '向心加速度', '运动学'],
  model: 'circular',
  adapter: 'circular',
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
      default: 2,
      min: 0.5,
      max: 4,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'omega',
      label: '角速度 ω',
      kind: 'number',
      default: 1.5,
      min: 0.3,
      max: 4,
      step: 0.1,
      unit: 'rad/s',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '轨道' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'x',
      charts: [
        {
          id: 'xy',
          title: '坐标 · x(t) / y(t)',
          xLabel: 't (s)',
          leftLabel: 'x, y (m)',
          series: [
            { key: 'x', label: 'x', color: '#38bdf8', unit: 'm' },
            { key: 'y', label: 'y', color: '#fbbf24', unit: 'm' },
          ],
        },
        {
          id: 'vel',
          title: '速度分量',
          xLabel: 't (s)',
          leftLabel: 'v (m/s)',
          series: [
            { key: 'vx', label: 'vₓ', color: '#60a5fa', unit: 'm/s' },
            { key: 'vy', label: 'vᵧ', color: '#4ade80', unit: 'm/s' },
            { key: 'speed', label: '|v|', color: '#f472b6', unit: 'm/s' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'x', label: 'x', unit: 'm', tone: 'slate' },
    { key: 'y', label: 'y', unit: 'm', tone: 'slate' },
    { key: 'speed', label: '|v|', unit: 'm/s', tone: 'green' },
    { key: 'an', label: 'aₙ', unit: 'm/s²', tone: 'purple' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'amber' },
    { key: 'period', label: 'T', unit: 's', tone: 'blue' },
  ],
  docs: {
    title: '匀速圆周运动',
    summary:
      '质点以恒定速率绕圆心做圆周运动。观察切向速度与指向圆心的向心加速度；一个周期内 x、y 呈正交简谐。',
    concept: [
      '匀速圆周运动速率不变，但速度方向持续改变，故有向心加速度 aₙ = ω²R = v²/R，方向指向圆心。',
      '投影到直径上，x(t)、y(t) 为相位相差 π/2 的简谐振动，可与「简谐振动」演示对照。',
    ],
    objectives: [
      '辨认速度切向、加速度径向',
      '验证 |v| = ωR、aₙ = ω²R',
      '理解圆周运动与正交简谐的联系',
    ],
    formulas: [
      'x = R\\cos\\omega t,\\quad y = R\\sin\\omega t',
      'v = \\omega R',
      'a_n = \\omega^2 R = \\dfrac{v^2}{R}',
    ],
    insight: '绿箭头为速度 v（切向），粉箭头为向心加速度 aₙ（指向圆心）。|v| 读数应保持恒定。',
    legend: [
      { color: '#38bdf8', label: '已走过弧' },
      { id: 'compare', color: '#f472b6', label: '完整圆对比' },
      { color: '#4ade80', label: '速度 v' },
      { color: '#f472b6', label: '向心加速度 aₙ' },
      { color: '#a78bfa', label: '半径' },
    ],
    steps: [
      {
        id: 'param',
        title: '参数方程',
        body: '取圆心为原点，逆时针为正方向。',
        formulas: ['x = R\\cos\\omega t', 'y = R\\sin\\omega t'],
        bindings: [
          { labelTex: 'R', valueKey: 'R', unit: 'm' },
          { labelTex: '\\omega', valueKey: 'omega', unit: 'rad/s' },
        ],
      },
      {
        id: 'live',
        title: '瞬时矢量',
        body: '拖动时间轴，对照位置、速度与向心加速度方向。',
        formulas: ['\\vec v \\perp \\vec r', '\\vec a_n \\parallel -\\vec r'],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's' },
          { labelTex: 'x', valueKey: 'x', unit: 'm' },
          { labelTex: 'y', valueKey: 'y', unit: 'm' },
          { labelTex: '|v|', valueKey: 'speed', unit: 'm/s' },
          { labelTex: 'a_n', valueKey: 'an', unit: 'm/s^2' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'period',
        title: '周期与向心加速度',
        body: '一周时间 T = 2π/ω；加速度大小由 ω 与 R 决定。',
        formulas: ['T = \\dfrac{2\\pi}{\\omega}', 'a_n = \\omega^2 R'],
        bindings: [
          { labelTex: 'T', valueKey: 'period', unit: 's' },
          { labelTex: 'a_n', valueKey: 'an', unit: 'm/s^2' },
        ],
      },
    ],
    challenges: [
      {
        id: 'period-2',
        prompt: '调节 ω，使周期 T ≈ 2.0 s。',
        hint: 'T = 2π/ω ⇒ ω ≈ π ≈ 3.14 rad/s。',
        check: { kind: 'valueNear', key: 'period', target: 2, tol: 0.08 },
      },
      {
        id: 'an-check',
        prompt: '取 R=2、ω=2，使 aₙ ≈ 8 m/s²。',
        hint: 'aₙ = ω²R = 4×2 = 8。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'R', target: 2, tol: 0.08 },
            { kind: 'paramNear', key: 'omega', target: 2, tol: 0.08 },
            { kind: 'valueNear', key: 'an', target: 8, tol: 0.35 },
          ],
        },
      },
    ],
  },
}

export function registerCircularDemo(): void {
  registerDemoBundle({
    meta: circularMeta,
    model: createCircularModel,
    adapter: createCircularAdapter,
  })
}
