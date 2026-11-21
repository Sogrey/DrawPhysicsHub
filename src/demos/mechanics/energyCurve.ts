import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createEnergyCurveAdapter } from './energyCurveAdapter'

/**
 * 谐振子机械能与势能曲线联动：
 *   U(x)=½ k x²， x=A cos(ωt)， ω=√(k/m)
 *   E=½ k A² = K+U（守恒）
 */
export function createEnergyCurveModel(): PhysicsModel {
  let m = 1
  let k = 4
  let A = 1.5
  let t = 0
  let trailX: number[][] = []

  function omega() {
    return Math.sqrt(k / Math.max(1e-9, m))
  }

  function period() {
    return (2 * Math.PI) / Math.max(1e-9, omega())
  }

  function stateAt(time: number) {
    const w = omega()
    const x = A * Math.cos(w * time)
    const vx = -A * w * Math.sin(w * time)
    const U = 0.5 * k * x * x
    const K = 0.5 * m * vx * vx
    const E = 0.5 * k * A * A
    return { x, vx, U, K, E, w }
  }

  function rebuildTrail(upto: number) {
    trailX = []
    const n = Math.max(2, Math.ceil(upto / 0.02))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const { x } = stateAt(ti)
      trailX.push([x, 0])
    }
  }

  /** U(x) 曲线采样，供画面绘制 */
  function potentialCurve(): number[][] {
    const pts: number[][] = []
    const n = 80
    const xMax = A * 1.35
    for (let i = 0; i <= n; i++) {
      const x = -xMax + (2 * xMax * i) / n
      pts.push([x, 0.5 * k * x * x])
    }
    return pts
  }

  return {
    init(params: ParamValues) {
      m = Number(params.m ?? 1)
      k = Number(params.k ?? 4)
      A = Number(params.A ?? 1.5)
      t = 0
      const { x } = stateAt(0)
      trailX = [[x, 0]]
    },
    step(dt: number) {
      const T = period()
      t = Math.min(T, t + dt)
      const { x } = stateAt(t)
      trailX.push([x, 0])
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
          m,
          k,
          A,
          omega: s.w,
          x: s.x,
          vx: s.vx,
          U: s.U,
          K: s.K,
          E: s.E,
          period: T,
          tMax: T,
          /** E − (K+U)，守恒残差 */
          residual: s.E - (s.K + s.U),
          turning: A,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: {
          path: trailX.map((p) => [...p]),
          potential: potentialCurve(),
        },
      }
    },
    reset() {
      t = 0
      const { x } = stateAt(0)
      trailX = [[x, 0]]
    },
    setParams(params) {
      if (params.m !== undefined) m = Number(params.m)
      if (params.k !== undefined) k = Number(params.k)
      if (params.A !== undefined) A = Number(params.A)
    },
  }
}

export const energyCurveMeta: DemoMeta = {
  id: 'mech-energy-curve',
  subject: '力学',
  category: '动能和势能',
  tags: ['势能', '守恒', '机械能', '势能曲线'],
  model: 'energyCurve',
  adapter: 'energyCurve',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'm',
      label: '质量 m',
      kind: 'number',
      default: 1,
      min: 0.4,
      max: 4,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'k',
      label: '劲度系数 k',
      kind: 'number',
      default: 4,
      min: 1,
      max: 12,
      step: 0.5,
      unit: 'N/m',
    },
    {
      key: 'A',
      label: '振幅 A',
      kind: 'number',
      default: 1.5,
      min: 0.4,
      max: 2.5,
      step: 0.1,
      unit: 'm',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '势能曲线' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'x',
      charts: [
        {
          id: 'energy',
          title: 'K / U / E',
          xLabel: 't (s)',
          leftLabel: '能量 (J)',
          series: [
            { key: 'K', label: 'K', color: '#4ade80', unit: 'J' },
            { key: 'U', label: 'U', color: '#fbbf24', unit: 'J' },
            { key: 'E', label: 'E', color: '#f472b6', unit: 'J' },
          ],
        },
        {
          id: 'xv',
          title: 'x(t)',
          xLabel: 't (s)',
          leftLabel: 'x (m)',
          series: [{ key: 'x', label: 'x', color: '#38bdf8', unit: 'm' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'x', label: 'x', unit: 'm', tone: 'blue' },
    { key: 'K', label: 'K', unit: 'J', tone: 'green' },
    { key: 'U', label: 'U', unit: 'J', tone: 'amber' },
    { key: 'E', label: 'E', unit: 'J', tone: 'purple' },
    { key: 'period', label: 'T', unit: 's', tone: 'slate' },
  ],
  docs: {
    title: '机械能 / 势能曲线',
    summary:
      '一维谐振子在势能曲线 U(x)=½kx² 上运动。总能量 E 水平线与曲线交点为转折点；竖直间隙表示动能 K。',
    concept: [
      '保守力场中机械能 E=K+U 守恒。势能曲线上，粒子不能进入 U>E 的区域。',
      'E 与 U(x) 的交点是速度为零的转折点；本例转折点为 x=±A。',
      '同一时刻：曲线上的点高度为 U，到 E 线的竖直线段长度为 K。',
    ],
    objectives: [
      '在 U–x 图上读出 U、K、E',
      '指出转折点与振幅关系',
      '验证 E=K+U 守恒',
    ],
    formulas: [
      'U(x)=\\tfrac12 k x^2',
      'E=\\tfrac12 k A^2=K+U',
      '\\omega=\\sqrt{k/m},\\quad x=A\\cos\\omega t',
    ],
    insight:
      '粉线为总能量 E；金点在势能曲线上。拖动时间轴，看 K（绿段）与 U 此消彼长，E 不变。',
    legend: [
      { color: '#fbbf24', label: '势能曲线 U(x)' },
      { id: 'compare', color: '#f472b6', label: '总能量 E' },
      { color: '#4ade80', label: '动能 K（竖线）' },
      { color: '#38bdf8', label: '质点位置' },
    ],
    steps: [
      {
        id: 'potential',
        title: '势能曲线',
        body: '抛物线 U=½kx²；振幅 A 决定总能量高度。',
        formulas: ['U=\\tfrac12 k x^2', 'E=\\tfrac12 k A^2'],
        bindings: [
          { labelTex: 'k', valueKey: 'k', unit: 'N/m' },
          { labelTex: 'A', valueKey: 'A', unit: 'm' },
          { labelTex: 'E', valueKey: 'E', unit: 'J' },
        ],
      },
      {
        id: 'split',
        title: '动能与势能消长',
        body: '在平衡位置 K 最大、U=0；在转折点 K=0、U=E。',
        formulas: ['K=E-U', 'K+U=E'],
        bindings: [
          { labelTex: 'x', valueKey: 'x', unit: 'm' },
          { labelTex: 'K', valueKey: 'K', unit: 'J' },
          { labelTex: 'U', valueKey: 'U', unit: 'J' },
          { labelTex: 'E', valueKey: 'E', unit: 'J' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'conserve',
        title: '守恒检验',
        body: '残差 residual = E−(K+U) 应接近 0。',
        formulas: ['E-(K+U)\\approx 0'],
        bindings: [{ labelTex: '\\Delta', valueKey: 'residual', unit: 'J' }],
      },
    ],
    challenges: [
      {
        id: 'conserve',
        prompt: '任意时刻确认 residual ≈ 0（机械能守恒）。',
        hint: '解析谐振子严格守恒；读数应接近 0。',
        check: { kind: 'valueNear', key: 'residual', target: 0, tol: 0.08 },
      },
      {
        id: 'E-from-A',
        prompt: '取 k=4、A=1，使 E≈2 J。',
        hint: 'E=½kA²=½×4×1=2。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'k', target: 4, tol: 0.08 },
            { kind: 'paramNear', key: 'A', target: 1, tol: 0.08 },
            { kind: 'valueNear', key: 'E', target: 2, tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerEnergyCurveDemo(): void {
  registerDemoBundle({
    meta: energyCurveMeta,
    model: createEnergyCurveModel,
    adapter: createEnergyCurveAdapter,
  })
}
