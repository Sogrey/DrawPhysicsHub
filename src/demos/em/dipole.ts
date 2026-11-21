import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { makeGrid2D, sampleVector2D } from '@/core/physics/field'
import { createDipoleAdapter } from './dipoleAdapter'

/** 教学单位 k=1 */
const K = 1
const NX = 15
const NY = 11
const WORLD = 4.5

/**
 * 电偶极子：±Q 间距 a，偶极矩 p=Q a（固定 p 时缩小 a → 理想偶极极限）。
 * 精确场：两点电荷叠加；理想场：E = [3(p̂·r̂)r̂ − p̂] p / r³
 */
export function createDipoleModel(): PhysicsModel {
  let p = 2.4
  let a = 1.2
  let R = 2.8
  let t = 0

  function period() {
    return 6
  }

  function Qmag() {
    return p / Math.max(a, 1e-6)
  }

  function charges() {
    const Q = Qmag()
    return [
      { x: -a / 2, y: 0, Q: -Q }, // − → + 沿 +x，p 指向 +x
      { x: a / 2, y: 0, Q: +Q },
    ] as const
  }

  function fieldExact(x: number, y: number): [number, number] {
    let Ex = 0
    let Ey = 0
    for (const c of charges()) {
      const dx = x - c.x
      const dy = y - c.y
      const r2 = dx * dx + dy * dy
      if (r2 < 0.1 * 0.1) continue
      const r = Math.sqrt(r2)
      const mag = (K * c.Q) / r2
      Ex += (mag * dx) / r
      Ey += (mag * dy) / r
    }
    return [Ex, Ey]
  }

  /** 理想点偶极：p 沿 +x */
  function fieldIdeal(x: number, y: number): [number, number] {
    const r2 = x * x + y * y
    if (r2 < 0.2 * 0.2) return [0, 0]
    const r = Math.sqrt(r2)
    const r3 = r2 * r
    const rhx = x / r
    const rhy = y / r
    // p⃗ = (p, 0); 3(p·r̂)r̂ − p
    const pDot = p * rhx
    const Ex = (K * (3 * pDot * rhx - p)) / r3
    const Ey = (K * (3 * pDot * rhy)) / r3
    return [Ex, Ey]
  }

  function probeAt(time: number) {
    const omega = (2 * Math.PI) / period()
    const th = omega * time
    const x = R * Math.cos(th)
    const y = R * Math.sin(th)
    const [Ex, Ey] = fieldExact(x, y)
    const [ExI, EyI] = fieldIdeal(x, y)
    const Emag = Math.hypot(Ex, Ey)
    const EmagI = Math.hypot(ExI, EyI)
    const ratio = EmagI > 1e-9 ? Emag / EmagI : 0
    return { x, y, Ex, Ey, Emag, ExI, EyI, EmagI, ratio, th }
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
    return sampleVector2D(grid, fieldExact)
  }

  return {
    init(params: ParamValues) {
      p = Number(params.p ?? 2.4)
      a = Number(params.a ?? 1.2)
      R = Number(params.R ?? 2.8)
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
      const pr = probeAt(t)
      const T = period()
      const field = sampleField()
      const cs = charges()
      const Q = Qmag()
      // 轴上 / 赤道对照点（固定 r=R）
      const [ExAx, EyAx] = fieldExact(R, 0)
      const [ExEq, EyEq] = fieldExact(0, R)
      const [ExAxI] = fieldIdeal(R, 0)
      const [, EyEqI] = fieldIdeal(0, R)
      return {
        time: t,
        values: {
          p,
          a,
          R,
          Q,
          K,
          x: pr.x,
          y: pr.y,
          Ex: pr.Ex,
          Ey: pr.Ey,
          Emag: pr.Emag,
          ExI: pr.ExI,
          EyI: pr.EyI,
          EmagI: pr.EmagI,
          ratio: pr.ratio,
          EmagAx: Math.hypot(ExAx, EyAx),
          EmagEq: Math.hypot(ExEq, EyEq),
          EmagAxI: Math.abs(ExAxI),
          EmagEqI: Math.abs(EyEqI),
          qMinusX: cs[0].x,
          qPlusX: cs[1].x,
          theta: (pr.th * 180) / Math.PI,
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
      if (params.p !== undefined) p = Number(params.p)
      if (params.a !== undefined) a = Number(params.a)
      if (params.R !== undefined) R = Number(params.R)
    },
  }
}

export const dipoleMeta: DemoMeta = {
  id: 'em-dipole',
  subject: '电磁学',
  category: '静电场',
  tags: ['偶极', '电场', '极限'],
  model: 'dipole',
  adapter: 'dipole',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'p',
      label: '偶极矩 p',
      kind: 'number',
      default: 2.4,
      min: 0.5,
      max: 4,
      step: 0.1,
      unit: 'u·m',
    },
    {
      key: 'a',
      label: '间距 a',
      kind: 'number',
      default: 1.2,
      min: 0.2,
      max: 2.5,
      step: 0.05,
      unit: 'm',
    },
    {
      key: 'R',
      label: '探测半径 R',
      kind: 'number',
      default: 2.8,
      min: 1.5,
      max: 4,
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
          id: 'EexactIdeal',
          title: '精确 vs 理想 |E|',
          xLabel: 't (s)',
          leftLabel: '|E|',
          series: [
            { key: 'Emag', label: '|E| 精确', color: '#f472b6', unit: 'u' },
            { key: 'EmagI', label: '|E| 理想', color: '#34d399', unit: 'u' },
          ],
        },
        {
          id: 'ratio',
          title: '比值 |E|/|E|ᵢᵈₑₐₗ',
          xLabel: 't (s)',
          leftLabel: 'ratio',
          series: [{ key: 'ratio', label: 'ratio', color: '#a78bfa', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'Emag', label: '|E|', unit: 'u', tone: 'purple' },
    { key: 'EmagI', label: '|E|ᵢ', unit: 'u', tone: 'green' },
    { key: 'ratio', label: 'ratio', unit: '', tone: 'amber' },
    { key: 'Q', label: '|Q|', unit: 'u', tone: 'blue' },
    { key: 'a', label: 'a', unit: 'm', tone: 'slate' },
  ],
  docs: {
    title: '电偶极子场',
    summary:
      '固定偶极矩 p=Qa，缩小间距 a（|Q|=p/a 增大）逼近理想点偶极。电场线（带方向箭头）为精确两点电荷场；探测点同时读出精确与理想 |E| 及比值。',
    concept: [
      '偶极矩 p⃗ 由 −Q 指向 +Q；教学单位取 k=1。',
      '理想点偶极场 E = [3(p⃗·r̂)r̂ − p⃗] / r³（k=1）。',
      '轴上 |E|≈2p/r³，赤道 |E|≈p/r³；a≪r 时精确场趋近理想公式。',
    ],
    objectives: [
      '辨认 p 方向与 ±Q 排布',
      '对照精确 / 理想 |E| 与比值',
      '缩小 a 观察极限逼近',
    ],
    formulas: [
      '\\vec p=Q\\,a\\,\\hat x',
      '\\vec E_{\\mathrm{ideal}}=\\dfrac{3(\\vec p\\cdot\\hat r)\\hat r-\\vec p}{r^3}',
      'E_{\\parallel}\\approx\\dfrac{2p}{r^3},\\quad E_{\\perp}\\approx\\dfrac{p}{r^3}',
    ],
    insight:
      '紫色电场线由 +Q 指向 −Q；粉箭头=探测点精确场，绿箭头=理想场。减小 a（保持 p）看 ratio→1。',
    legend: [
      { color: '#f87171', label: '+Q' },
      { color: '#38bdf8', label: '−Q' },
      { color: '#a78bfa', label: '电场线（带方向）' },
      { color: '#34d399', label: '理想场（探测点）' },
      { id: 'compare', color: '#f472b6', label: '探测圆' },
      { color: '#fbbf24', label: '探测点' },
    ],
    steps: [
      {
        id: 'dipole-p',
        title: '偶极矩',
        body: '−Q 与 +Q 间距 a，p=Qa 沿连线由负指向正。',
        formulas: ['\\vec p=Q a\\,\\hat x', 'Q=p/a'],
        bindings: [
          { labelTex: 'p', valueKey: 'p', unit: 'u·m' },
          { labelTex: 'a', valueKey: 'a', unit: 'm' },
          { labelTex: '|Q|', valueKey: 'Q', unit: 'u' },
        ],
      },
      {
        id: 'exact-ideal',
        title: '精确 vs 理想',
        body: '探测点同时显示精确叠加场与理想点偶极公式。',
        formulas: [
          '\\vec E=\\vec E_++\\vec E_-',
          '\\vec E_{\\mathrm{ideal}}=\\dfrac{3(\\vec p\\cdot\\hat r)\\hat r-\\vec p}{r^3}',
        ],
        bindings: [
          { labelTex: '|E|', valueKey: 'Emag', unit: 'u' },
          { labelTex: '|E|_{\\mathrm{ideal}}', valueKey: 'EmagI', unit: 'u' },
          { labelTex: 'ratio', valueKey: 'ratio', unit: '' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'limit',
        title: '极限过程',
        body: '固定 p，减小 a，远区比值趋近 1。',
        formulas: ['a\\ll r\\Rightarrow E\\to E_{\\mathrm{ideal}}'],
        bindings: [
          { labelTex: 'a', valueKey: 'a', unit: 'm' },
          { labelTex: 'R', valueKey: 'R', unit: 'm' },
          { labelTex: 'ratio', valueKey: 'ratio', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'axis-vs-eq',
        prompt: '取 p=2.4、a≤0.5、R≈2.8，使轴上 |E|≈2p/R³、赤道 |E|≈p/R³。',
        hint: '理想极限：轴上约为赤道的两倍。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'p', target: 2.4, tol: 0.15 },
            { kind: 'paramNear', key: 'a', target: 0.35, tol: 0.2 },
            { kind: 'paramNear', key: 'R', target: 2.8, tol: 0.2 },
            {
              kind: 'valueNear',
              key: 'EmagAx',
              target: (2 * 2.4) / 2.8 ** 3,
              tol: 0.08,
            },
            {
              kind: 'valueNear',
              key: 'EmagEq',
              target: 2.4 / 2.8 ** 3,
              tol: 0.05,
            },
          ],
        },
      },
      {
        id: 'shrink-limit',
        prompt: '固定 p=2.4，将 a 调到 ≤0.35，使探测点 ratio 接近 1（容差 0.12）。',
        hint: '保持 p，缩小 a；探测点在圆周上任一点均可。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'p', target: 2.4, tol: 0.15 },
            { kind: 'paramNear', key: 'a', target: 0.3, tol: 0.12 },
            { kind: 'valueNear', key: 'ratio', target: 1, tol: 0.12 },
          ],
        },
      },
    ],
  },
}

export function registerDipoleDemo(): void {
  registerDemoBundle({
    meta: dipoleMeta,
    model: createDipoleModel,
    adapter: createDipoleAdapter,
  })
}
