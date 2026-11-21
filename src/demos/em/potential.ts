import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createPotentialAdapter } from './potentialAdapter'

/** 教学单位：k=1，V=Σ Q/r，E=Σ Q r̂/r² */
const K = 1
const WORLD = 4.5

export type Charge = { x: number; y: number; Q: number }

export function potentialAt(charges: readonly Charge[], x: number, y: number): number {
  let V = 0
  for (const c of charges) {
    const dx = x - c.x
    const dy = y - c.y
    const r = Math.hypot(dx, dy)
    if (r < 0.18) continue
    V += (K * c.Q) / r
  }
  return V
}

export function fieldAt(charges: readonly Charge[], x: number, y: number): [number, number] {
  let Ex = 0
  let Ey = 0
  for (const c of charges) {
    const dx = x - c.x
    const dy = y - c.y
    const r2 = dx * dx + dy * dy
    if (r2 < 0.18 * 0.18) continue
    const r = Math.sqrt(r2)
    const mag = (K * c.Q) / r2
    Ex += (mag * dx) / r
    Ey += (mag * dy) / r
  }
  return [Ex, Ey]
}

/**
 * 两点电荷电势与等势线：
 *   V = Σ k Qᵢ / rᵢ
 *   E = −∇V（与等势线正交）
 * 播放：探测点沿半径 R 绕行，读出当地 V 与 E。
 */
export function createPotentialModel(): PhysicsModel {
  let Q1 = 2
  let Q2 = -1.5
  let d = 2.4
  let R = 2.2
  let t = 0

  function period() {
    return 8
  }

  function charges(): Charge[] {
    return [
      { x: -d / 2, y: 0, Q: Q1 },
      { x: d / 2, y: 0, Q: Q2 },
    ]
  }

  function probeAt(time: number) {
    const omega = (2 * Math.PI) / period()
    const th = omega * time
    const x = R * Math.cos(th)
    const y = R * Math.sin(th)
    const cs = charges()
    const V = potentialAt(cs, x, y)
    const [Ex, Ey] = fieldAt(cs, x, y)
    const Emag = Math.hypot(Ex, Ey)
    const r1 = Math.hypot(x + d / 2, y)
    const r2 = Math.hypot(x - d / 2, y)
    return { x, y, V, Ex, Ey, Emag, th, r1, r2 }
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
      const cs = charges()
      const V0 = potentialAt(cs, 0, 0)
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
          V: p.V,
          Ex: p.Ex,
          Ey: p.Ey,
          Emag: p.Emag,
          V0,
          r1: p.r1,
          r2: p.r2,
          q1x: cs[0]!.x,
          q1y: cs[0]!.y,
          q2x: cs[1]!.x,
          q2y: cs[1]!.y,
          theta: (p.th * 180) / Math.PI,
          period: T,
          tMax: T,
          world: WORLD,
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

export const potentialMeta: DemoMeta = {
  id: 'em-potential',
  subject: '电磁学',
  category: '静电场',
  tags: ['电势', '等势线', '叠加'],
  model: 'potential',
  adapter: 'potential',
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
    { id: 'main2d', kind: 'canvas2d', title: '电势' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'V',
      charts: [
        {
          id: 'potential',
          title: '探测点电势',
          xLabel: 't (s)',
          leftLabel: 'V',
          series: [
            { key: 'V', label: 'V', color: '#22d3ee', unit: 'u' },
            { key: 'Emag', label: '|E|', color: '#f472b6', unit: 'u' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'V', label: 'V', unit: 'u', tone: 'blue' },
    { key: 'Emag', label: '|E|', unit: 'u', tone: 'purple' },
    { key: 'V0', label: 'V(O)', unit: 'u', tone: 'green' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'amber' },
    { key: 'd', label: 'd', unit: 'm', tone: 'slate' },
  ],
  docs: {
    title: '电势与等势线',
    summary:
      '点电荷电势 V=Σ kQ/r（k=1）。青色等势线为 V=常数；电场垂直于等势线。探测点绕行读出当地 V 与 E。',
    concept: [
      '电势是标量，可直接代数叠加；电场是电势的负梯度。',
      '等势线上移动不做功；E 处处垂直于等势线。',
      '正电荷附近 V 高，负电荷附近 V 低；异号时中间出现鞍形等势。',
    ],
    objectives: [
      '从等势线疏密感受 |E|（密→|E|大）',
      '对照顶栏 V=kQ₁/r₁+kQ₂/r₂ 与探测点读数',
      '观察粉箭头 E 与青色等势线正交',
    ],
    formulas: [
      'V=\\sum_i k\\dfrac{Q_i}{r_i}',
      '\\vec E=-\\nabla V',
      '\\vec E\\perp\\text{等势线}',
    ],
    insight:
      '青线为等势线（标数值）；粉箭头为探测点处 E。拖时间轴看 V 随位置变化，并核对公式代入。',
    legend: [
      { color: '#f87171', label: '正电荷' },
      { color: '#38bdf8', label: '负电荷' },
      { color: '#22d3ee', label: '等势线 V=const' },
      { color: '#f472b6', label: '电场 E（⊥等势线）' },
      { id: 'compare', color: '#a78bfa', label: '探测圆轨迹' },
      { color: '#fbbf24', label: '探测点' },
    ],
    steps: [
      {
        id: 'Vsum',
        title: '电势叠加',
        body: '各点电荷电势代数相加。',
        formulas: ['V=kQ_1/r_1+kQ_2/r_2'],
        bindings: [
          { labelTex: 'Q_1', valueKey: 'Q1', unit: 'u' },
          { labelTex: 'Q_2', valueKey: 'Q2', unit: 'u' },
          { labelTex: 'r_1', valueKey: 'r1', unit: 'm' },
          { labelTex: 'r_2', valueKey: 'r2', unit: 'm' },
          { labelTex: 'V', valueKey: 'V', unit: 'u' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'ortho',
        title: 'E ⊥ 等势线',
        body: '电场指向电势降低最快的方向，故与等势线正交。',
        formulas: ['\\vec E=-\\nabla V'],
        bindings: [
          { labelTex: '|E|', valueKey: 'Emag', unit: 'u' },
          { labelTex: 'E_x', valueKey: 'Ex', unit: 'u' },
          { labelTex: 'E_y', valueKey: 'Ey', unit: 'u' },
        ],
      },
      {
        id: 'center',
        title: '中点电势',
        body: '原点 O 的 V 可快速对照同号/异号。',
        formulas: ['V(O)'],
        bindings: [{ labelTex: 'V(O)', valueKey: 'V0', unit: 'u' }],
      },
    ],
    challenges: [
      {
        id: 'high-V',
        prompt: '取 Q₁=2、Q₂=-1.5，把探测点扫到 V 较大的一侧（靠近正电荷）。',
        hint: '播放到靠近 Q₁（红）时 V 升高。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'Q1', target: 2, tol: 0.2 },
            { kind: 'valueNear', key: 'V', target: 1.2, tol: 0.9 },
          ],
        },
      },
      {
        id: 'iso-cancel',
        prompt: '令 Q₁=Q₂=1.5，使中点 V(O)≈2×(1.5/(d/2)) 且对称。',
        hint: '等量同号时中点 V=2kQ/(d/2)。d=2.4 → V(O)≈2.5。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'Q1', target: 1.5, tol: 0.1 },
            { kind: 'paramNear', key: 'Q2', target: 1.5, tol: 0.1 },
            { kind: 'valueNear', key: 'V0', target: 2.5, tol: 0.35 },
          ],
        },
      },
    ],
  },
}

export function registerPotentialDemo(): void {
  registerDemoBundle({
    meta: potentialMeta,
    model: createPotentialModel,
    adapter: createPotentialAdapter,
  })
}
