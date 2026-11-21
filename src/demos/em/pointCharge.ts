import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { makeGrid2D, sampleVector2D } from '@/core/physics/field'
import { createPointChargeAdapter } from './pointChargeAdapter'

/** 教学单位：取 k=1，电荷以任意单位计 */
const K = 1
const NX = 15
const NY = 11
const WORLD = 4.5

/**
 * 两点电荷电场叠加：
 *   E = Σ k Q r̂ / r²
 * 探测点沿半径 R 缓慢绕行，展示叠加场随位置变化。
 */
export function createPointChargeModel(): PhysicsModel {
  let Q1 = 2
  let Q2 = -1.5
  let d = 2.4
  let R = 2.2
  let t = 0

  function period() {
    return 6
  }

  function charges() {
    return [
      { x: -d / 2, y: 0, Q: Q1 },
      { x: d / 2, y: 0, Q: Q2 },
    ] as const
  }

  function fieldAt(x: number, y: number): [number, number] {
    let Ex = 0
    let Ey = 0
    for (const c of charges()) {
      const dx = x - c.x
      const dy = y - c.y
      const r2 = dx * dx + dy * dy
      if (r2 < 0.12 * 0.12) continue // 避开奇点
      const r = Math.sqrt(r2)
      const mag = (K * c.Q) / r2
      Ex += (mag * dx) / r
      Ey += (mag * dy) / r
    }
    return [Ex, Ey]
  }

  function probeAt(time: number) {
    const omega = (2 * Math.PI) / period()
    const th = omega * time
    const x = R * Math.cos(th)
    const y = R * Math.sin(th)
    const [Ex, Ey] = fieldAt(x, y)
    const Emag = Math.hypot(Ex, Ey)
    return { x, y, Ex, Ey, Emag, th }
  }

  function sampleField() {
    const grid = makeGrid2D({
      xMin: -WORLD,
      xMax: WORLD,
      yMin: -WORLD * 0.75,
      yMax: WORLD * 0.75,
      nx: NX,
      ny: NY,
    })
    return sampleVector2D(grid, fieldAt)
  }

  return {
    init(params: ParamValues) {
      Q1 = Number(params.Q1 ?? 2)
      Q2 = Number(params.Q2 ?? -1.5)
      d = Number(params.d ?? 2.4)
      R = Number(params.R ?? 2.2)
      t = 0
    },
    step(dt: number) {
      const T = period()
      t = Math.min(T, t + dt)
    },
    seek(time: number) {
      const T = period()
      t = Math.min(T, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const p = probeAt(t)
      const T = period()
      const field = sampleField()
      const cs = charges()
      // 对称轴中点场：异号偶极近似 / 同号对照
      const [Ex0, Ey0] = fieldAt(0, 0)
      return {
        time: t,
        values: {
          Q1,
          Q2,
          d,
          R,
          K,
          x: p.x,
          y: p.y,
          Ex: p.Ex,
          Ey: p.Ey,
          Emag: p.Emag,
          Ex0,
          Ey0,
          Emag0: Math.hypot(Ex0, Ey0),
          q1x: cs[0].x,
          q1y: cs[0].y,
          q2x: cs[1].x,
          q2y: cs[1].y,
          theta: (p.th * 180) / Math.PI,
          period: T,
          tMax: T,
          world: WORLD,
          nx: NX,
          ny: NY,
          xMin: field.grid.xMin,
          xMax: field.grid.xMax,
          yMin: field.grid.yMin,
          yMax: field.grid.yMax,
          fieldVectors: field.vectors,
          done: t >= T - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.Q1 !== undefined) Q1 = Number(params.Q1)
      if (params.Q2 !== undefined) Q2 = Number(params.Q2)
      if (params.d !== undefined) d = Number(params.d)
      if (params.R !== undefined) R = Number(params.R)
    },
  }
}

export const pointChargeMeta: DemoMeta = {
  id: 'em-point-charge',
  subject: '电磁学',
  category: '静电场',
  tags: ['电场', '库仑', '叠加', '点电荷'],
  model: 'pointCharge',
  adapter: 'pointCharge',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'Q1',
      label: '电荷 Q₁',
      kind: 'number',
      default: 2,
      min: -3,
      max: 3,
      step: 0.1,
      unit: 'u',
    },
    {
      key: 'Q2',
      label: '电荷 Q₂',
      kind: 'number',
      default: -1.5,
      min: -3,
      max: 3,
      step: 0.1,
      unit: 'u',
    },
    {
      key: 'd',
      label: '间距 d',
      kind: 'number',
      default: 2.4,
      min: 1,
      max: 4,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'R',
      label: '探测半径 R',
      kind: 'number',
      default: 2.2,
      min: 1,
      max: 3.5,
      step: 0.1,
      unit: 'm',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '电场' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'Emag',
      charts: [
        {
          id: 'Ecomp',
          title: '探测点场分量',
          xLabel: 't (s)',
          leftLabel: 'E',
          series: [
            { key: 'Ex', label: 'Eₓ', color: '#60a5fa', unit: 'u' },
            { key: 'Ey', label: 'Eᵧ', color: '#fbbf24', unit: 'u' },
            { key: 'Emag', label: '|E|', color: '#f472b6', unit: 'u' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'Emag', label: '|E|', unit: 'u', tone: 'purple' },
    { key: 'Ex', label: 'Eₓ', unit: 'u', tone: 'blue' },
    { key: 'Ey', label: 'Eᵧ', unit: 'u', tone: 'amber' },
    { key: 'Emag0', label: '|E|(O)', unit: 'u', tone: 'green' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'slate' },
  ],
  docs: {
    title: '点电荷电场叠加',
    summary:
      '两个点电荷的电场矢量叠加。带方向箭头的电场线显示合场走向；探测点沿圆周运动，读出当地 Eₓ、Eᵧ 与 |E|。（教学单位取 k=1）',
    concept: [
      '静电场满足叠加原理：合场等于各点电荷贡献的矢量和。',
      '点电荷场 E = k Q r̂ / r²，方向由正电荷指出、负电荷吸入。',
      '异号电荷类似偶极：中点附近场大致沿连线；同号则中点场可相互抵消或增强（视符号）。',
    ],
    objectives: [
      '从电场线读出合场走向',
      '对照探测点读数理解叠加',
      '切换同号/异号观察中点 |E| 变化',
    ],
    formulas: [
      '\\vec E=\\sum_i k\\dfrac{Q_i}{r_i^2}\\hat r_i',
      'k=1\\;(\\text{教学单位})',
      '\\vec E_{\\mathrm{合}}=\\vec E_1+\\vec E_2',
    ],
    insight:
      '红/青圆为 Q₁、Q₂；紫色弧线为电场线（箭头表示方向：由正指向负）。粉箭头为探测点处合场。',
    legend: [
      { color: '#f87171', label: '正电荷' },
      { color: '#38bdf8', label: '负电荷' },
      { color: '#a78bfa', label: '电场线（带方向）' },
      { id: 'compare', color: '#f472b6', label: '探测圆轨迹' },
      { color: '#fbbf24', label: '探测点' },
    ],
    steps: [
      {
        id: 'coulomb',
        title: '库仑场',
        body: '每个点电荷独立贡献；合场是矢量相加。',
        formulas: [
          '\\vec E_i=k\\dfrac{Q_i}{r_i^2}\\hat r_i',
          '\\vec E=\\vec E_1+\\vec E_2',
        ],
        bindings: [
          { labelTex: 'Q_1', valueKey: 'Q1', unit: 'u' },
          { labelTex: 'Q_2', valueKey: 'Q2', unit: 'u' },
          { labelTex: 'd', valueKey: 'd', unit: 'm' },
        ],
      },
      {
        id: 'probe',
        title: '探测点',
        body: '探测点在半径 R 的圆上运动，读出当地合场。',
        formulas: ['|\\vec E|=\\sqrt{E_x^2+E_y^2}'],
        bindings: [
          { labelTex: 'E_x', valueKey: 'Ex', unit: 'u' },
          { labelTex: 'E_y', valueKey: 'Ey', unit: 'u' },
          { labelTex: '|E|', valueKey: 'Emag', unit: 'u' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'center',
        title: '中点对照',
        body: '原点 O 处合场可快速判断同号/异号配置。',
        formulas: ['|\\vec E|(O)'],
        bindings: [{ labelTex: '|E|(O)', valueKey: 'Emag0', unit: 'u' }],
      },
    ],
    challenges: [
      {
        id: 'opposite-center',
        prompt: '取 Q₁=2、Q₂=-2，使中点 |E|(O) 明显大于两侧同号情形。',
        hint: '异号时中点两贡献同向叠加。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'Q1', target: 2, tol: 0.15 },
            { kind: 'paramNear', key: 'Q2', target: -2, tol: 0.15 },
            { kind: 'valueNear', key: 'Emag0', target: 2.78, tol: 0.6 },
          ],
        },
      },
      {
        id: 'same-cancel',
        prompt: '令 Q₁=Q₂=1.5，使中点 |E|(O)≈0。',
        hint: '等量同号时中点场相互抵消。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'Q1', target: 1.5, tol: 0.1 },
            { kind: 'paramNear', key: 'Q2', target: 1.5, tol: 0.1 },
            { kind: 'valueNear', key: 'Emag0', target: 0, tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerPointChargeDemo(): void {
  registerDemoBundle({
    meta: pointChargeMeta,
    model: createPointChargeModel,
    adapter: createPointChargeAdapter,
  })
}
