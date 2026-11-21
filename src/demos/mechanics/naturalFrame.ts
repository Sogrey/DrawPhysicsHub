import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createNaturalFrameAdapter } from './naturalFrameAdapter'

/**
 * 自然坐标系：椭圆参数运动 r=(A cos ωt, B sin ωt)。
 * A≠B 时速率变化 → a_t、a_n 同时可见；A=B 退化为匀速圆周，a_t→0。
 */
export function createNaturalFrameModel(): PhysicsModel {
  let A = 3
  let B = 1.8
  let omega = 1.2
  let t = 0
  let trail: number[][] = []

  function period() {
    return (2 * Math.PI) / Math.max(1e-9, omega)
  }

  function stateAt(time: number) {
    const th = omega * time
    const c = Math.cos(th)
    const s = Math.sin(th)
    const x = A * c
    const y = B * s
    const vx = -A * omega * s
    const vy = B * omega * c
    const ax = -A * omega * omega * c
    const ay = -B * omega * omega * s

    const speed = Math.hypot(vx, vy)
    let etx = 0
    let ety = 0
    if (speed > 1e-12) {
      etx = vx / speed
      ety = vy / speed
    }

    // 候选法向：切向左旋 90°；取指向曲率中心（大致朝原点）一侧
    let enx = -ety
    let eny = etx
    if (enx * x + eny * y > 0) {
      enx = -enx
      eny = -eny
    }

    const at = ax * etx + ay * ety
    const an = ax * enx + ay * eny
    const rho = an > 1e-9 ? (speed * speed) / an : Number.POSITIVE_INFINITY

    return {
      x,
      y,
      vx,
      vy,
      ax,
      ay,
      speed,
      etx,
      ety,
      enx,
      eny,
      at,
      an,
      rho,
      th,
    }
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
      A = Number(params.A ?? 3)
      B = Number(params.B ?? 1.8)
      omega = Number(params.omega ?? 1.2)
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
      const s = stateAt(t)
      const T = period()
      return {
        time: t,
        values: {
          x: s.x,
          y: s.y,
          vx: s.vx,
          vy: s.vy,
          ax: s.ax,
          ay: s.ay,
          speed: s.speed,
          etx: s.etx,
          ety: s.ety,
          enx: s.enx,
          eny: s.eny,
          at: s.at,
          an: s.an,
          rho: Number.isFinite(s.rho) ? s.rho : 0,
          /** aₙ·ρ − v²，用于挑战「验证 aₙ = v²/ρ」 */
          residual: Number.isFinite(s.rho) ? s.an * s.rho - s.speed * s.speed : 0,
          A,
          B,
          omega,
          theta: (s.th * 180) / Math.PI,
          period: T,
          tMax: T,
          eccentricity: A > 1e-9 ? Math.sqrt(Math.max(0, 1 - (B * B) / (A * A))) : 0,
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
      if (params.A !== undefined) A = Number(params.A)
      if (params.B !== undefined) B = Number(params.B)
      if (params.omega !== undefined) omega = Number(params.omega)
    },
  }
}

export const naturalFrameMeta: DemoMeta = {
  id: 'mech-natural-frame',
  subject: '力学',
  category: '质点运动学',
  tags: ['切向', '法向', '曲率', '自然坐标系'],
  model: 'naturalFrame',
  adapter: 'naturalFrame',
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
      label: '半长轴 A',
      kind: 'number',
      default: 3,
      min: 1,
      max: 5,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'B',
      label: '半短轴 B',
      kind: 'number',
      default: 1.8,
      min: 0.6,
      max: 5,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'omega',
      label: '参数角速度 ω',
      kind: 'number',
      default: 1.2,
      min: 0.3,
      max: 3,
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
      chartKey: 'speed',
      charts: [
        {
          id: 'acc',
          title: '切向 / 法向加速度',
          xLabel: 't (s)',
          leftLabel: 'a (m/s²)',
          series: [
            { key: 'at', label: 'aₜ', color: '#4ade80', unit: 'm/s²' },
            { key: 'an', label: 'aₙ', color: '#f472b6', unit: 'm/s²' },
          ],
        },
        {
          id: 'speed',
          title: '速率与曲率半径',
          xLabel: 't (s)',
          leftLabel: 'v (m/s)',
          rightLabel: 'ρ (m)',
          series: [
            { key: 'speed', label: '|v|', color: '#38bdf8', unit: 'm/s' },
            { key: 'rho', label: 'ρ', color: '#fbbf24', unit: 'm', axis: 'right' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'speed', label: '|v|', unit: 'm/s', tone: 'blue' },
    { key: 'at', label: 'aₜ', unit: 'm/s²', tone: 'green' },
    { key: 'an', label: 'aₙ', unit: 'm/s²', tone: 'purple' },
    { key: 'rho', label: 'ρ', unit: 'm', tone: 'amber' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'slate' },
  ],
  docs: {
    title: '自然坐标系速度/加速度',
    summary:
      '质点沿椭圆轨道运动，在自然坐标系中分解加速度：切向 aₜ 改变速率，法向 aₙ = v²/ρ 改变方向。',
    concept: [
      '自然坐标系以轨迹本身为参照：ê_t 沿速度方向，ê_n 指向曲率中心。',
      '加速度分解为 a = aₜ ê_t + aₙ ê_n，其中 aₜ = dv/dt，aₙ = v²/ρ。',
      '椭圆参数运动在 A≠B 时速率周期性变化，故 aₜ 与 aₙ 同时出现；令 A=B 则退化为匀速圆周，aₜ→0。',
    ],
    objectives: [
      '辨认 ê_t、ê_n 与 aₜ、aₙ 矢量',
      '验证 aₙ ≈ v²/ρ',
      '对比椭圆与圆周情形下 aₜ 的差异',
    ],
    formulas: [
      '\\vec r = (A\\cos\\omega t,\\, B\\sin\\omega t)',
      '\\vec a = a_t\\,\\hat e_t + a_n\\,\\hat e_n',
      'a_t = \\dfrac{dv}{dt},\\quad a_n = \\dfrac{v^2}{\\rho}',
    ],
    insight:
      '绿箭头 aₜ（切向），粉箭头 aₙ（法向）；青箭头为速度 v。拖动时间轴观察顶点附近 aₜ 变号、曲率半径 ρ 变化。',
    legend: [
      { color: '#38bdf8', label: '已走过弧' },
      { id: 'compare', color: '#f472b6', label: '完整椭圆对比' },
      { color: '#22d3ee', label: '速度 v / ê_t' },
      { color: '#4ade80', label: '切向加速度 aₜ' },
      { color: '#f472b6', label: '法向加速度 aₙ' },
    ],
    steps: [
      {
        id: 'frame',
        title: '自然基矢',
        body: 'ê_t 与速度同向；ê_n 垂直于 ê_t 并指向曲率中心。',
        formulas: ['\\hat e_t = \\dfrac{\\vec v}{|\\vec v|}', '\\hat e_n \\perp \\hat e_t'],
        bindings: [
          { labelTex: 'A', valueKey: 'A', unit: 'm' },
          { labelTex: 'B', valueKey: 'B', unit: 'm' },
          { labelTex: '\\omega', valueKey: 'omega', unit: 'rad/s' },
        ],
      },
      {
        id: 'split',
        title: '加速度分解',
        body: '把 a 投影到 ê_t、ê_n，得到改变速率与改变方向的两部分。',
        formulas: ['a_t = \\vec a\\cdot\\hat e_t', 'a_n = \\vec a\\cdot\\hat e_n = v^2/\\rho'],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's' },
          { labelTex: '|v|', valueKey: 'speed', unit: 'm/s' },
          { labelTex: 'a_t', valueKey: 'at', unit: 'm/s^2' },
          { labelTex: 'a_n', valueKey: 'an', unit: 'm/s^2' },
          { labelTex: '\\rho', valueKey: 'rho', unit: 'm' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'circle-limit',
        title: '圆周极限',
        body: '当 A=B=R 时为匀速圆周：aₜ=0，aₙ=ω²R，ρ=R。',
        formulas: ['A=B=R \\Rightarrow a_t=0,\\; a_n=\\omega^2 R'],
        bindings: [
          { labelTex: 'A', valueKey: 'A', unit: 'm' },
          { labelTex: 'B', valueKey: 'B', unit: 'm' },
          { labelTex: 'a_t', valueKey: 'at', unit: 'm/s^2' },
        ],
      },
    ],
    challenges: [
      {
        id: 'circle-at0',
        prompt: '令 A=B=2，使 |aₜ| 在一周内始终很小（≈0）。',
        hint: '匀速圆周 aₜ=0；把两半轴调成相等。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'A', target: 2, tol: 0.08 },
            { kind: 'paramNear', key: 'B', target: 2, tol: 0.08 },
            { kind: 'valueNear', key: 'at', target: 0, tol: 0.25 },
          ],
        },
      },
      {
        id: 'an-rho',
        prompt: '拖动时间轴任意位置，使残差 aₙρ − v² ≈ 0（验证 aₙ = v²/ρ）。',
        hint: '该恒等式由定义保证；确认读数 residual 接近 0 即可。',
        check: { kind: 'valueNear', key: 'residual', target: 0, tol: 0.4 },
      },
    ],
  },
}

export function registerNaturalFrameDemo(): void {
  registerDemoBundle({
    meta: naturalFrameMeta,
    model: createNaturalFrameModel,
    adapter: createNaturalFrameAdapter,
  })
}
