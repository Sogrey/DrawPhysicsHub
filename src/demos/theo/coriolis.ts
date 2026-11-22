import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCoriolisAdapter } from './coriolisAdapter'

/**
 * 转动参考系中的科里奥利（水平面，Ω 沿 +z 出纸面）：
 *   a_cor = −2 Ω × v  →  (a_x, a_y) = (2 Ω v_y, −2 Ω v_x)
 *   a_cf  = Ω² (x, y)  （离心，可开关）
 * 无摩擦质点从近原点沿 +x 抛出；转系中轨迹弯曲。
 */
export function coriolisAccel(
  Omega: number,
  x: number,
  y: number,
  vx: number,
  vy: number,
  withCf: boolean,
): { ax: number; ay: number; acx: number; acy: number; afx: number; afy: number } {
  const acx = 2 * Omega * vy
  const acy = -2 * Omega * vx
  const afx = withCf ? Omega * Omega * x : 0
  const afy = withCf ? Omega * Omega * y : 0
  return { ax: acx + afx, ay: acy + afy, acx, acy, afx, afy }
}

const DISK_R = 3.2

export function createCoriolisModel(): PhysicsModel {
  let Omega = 0.9
  let v0 = 1.6
  let withCf = 0
  let t = 0
  const period = 5
  let trail: number[][] = []

  function stateAt(time: number) {
    let x = 0.08
    let y = 0
    let vx = v0
    let vy = 0
    const dt = 1 / 180
    trail = [[x, y]]
    const T = Math.min(period, Math.max(0, time))
    let tau = 0
    let rMax = Math.hypot(x, y)
    while (tau < T - 1e-12) {
      const h = Math.min(dt, T - tau)
      const a = coriolisAccel(Omega, x, y, vx, vy, withCf > 0.5)
      // 半隐式 Euler
      vx += a.ax * h
      vy += a.ay * h
      x += vx * h
      y += vy * h
      tau += h
      const r = Math.hypot(x, y)
      if (r > rMax) rMax = r
      // 出盘后仍积分，但放慢采样；画面用自适应 world 框住
      if (trail.length % 2 === 0) trail.push([x, y])
    }
    trail.push([x, y])
    const a = coriolisAccel(Omega, x, y, vx, vy, withCf > 0.5)
    const r = Math.hypot(x, y)
    const world = Math.max(DISK_R + 0.6, r + 1.1, rMax + 0.8)
    return { x, y, vx, vy, r, rMax, world, ...a }
  }

  return {
    init(params: ParamValues) {
      Omega = Number(params.Omega ?? 0.9)
      v0 = Number(params.v0 ?? 1.6)
      withCf = Number(params.withCf ?? 0)
      t = 0
      stateAt(0)
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      return {
        time: t,
        values: {
          Omega,
          v0,
          withCf,
          x: s.x,
          y: s.y,
          r: s.r,
          vx: s.vx,
          vy: s.vy,
          acx: s.acx,
          acy: s.acy,
          afx: s.afx,
          afy: s.afy,
          ax: s.ax,
          ay: s.ay,
          acmag: Math.hypot(s.acx, s.acy),
          afmag: Math.hypot(s.afx, s.afy),
          speed: Math.hypot(s.vx, s.vy),
          diskR: DISK_R,
          period,
          tMax: period,
          world: s.world,
          sense: Omega >= 0 ? 1 : -1,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.Omega !== undefined) Omega = Number(params.Omega)
      if (params.v0 !== undefined) v0 = Number(params.v0)
      if (params.withCf !== undefined) withCf = Number(params.withCf)
    },
  }
}

export const coriolisMeta: DemoMeta = {
  id: 'theo-coriolis',
  subject: '理论力学',
  category: '转动参考系',
  tags: ['科里奥利', '非惯性系', '转盘'],
  model: 'coriolis',
  adapter: 'coriolis',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'Omega',
      label: '角速度 Ω',
      kind: 'number',
      default: 0.9,
      min: 0.3,
      max: 2.0,
      step: 0.1,
      unit: 'rad/s',
    },
    {
      key: 'v0',
      label: '初速 v₀',
      kind: 'number',
      default: 1.6,
      min: 0.8,
      max: 2.8,
      step: 0.1,
      unit: 'u/s',
    },
    {
      key: 'withCf',
      label: '含离心力',
      kind: 'number',
      default: 0,
      min: 0,
      max: 1,
      step: 1,
      unit: '',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '转盘' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'acmag',
      charts: [
        {
          id: 'accel',
          title: '科里奥利加速度',
          xLabel: 't (s)',
          leftLabel: '|a|',
          series: [
            { key: 'acmag', label: '|a_cor|', color: '#f472b6', unit: '' },
            { key: 'speed', label: '|v|', color: '#4ade80', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'Omega', label: 'Ω', unit: '', tone: 'amber' },
    { key: 'acmag', label: '|a_c|', unit: '', tone: 'purple' },
    { key: 'speed', label: '|v|', unit: '', tone: 'green' },
    { key: 'x', label: 'x', unit: '', tone: 'blue' },
    { key: 'y', label: 'y', unit: '', tone: 'slate' },
  ],
  docs: {
    title: '科里奥利力示意',
    summary:
      '转盘（Ω 出纸面 ⊙）上沿 +x 抛出质点。默认只开科里奥利 a_cor=−2Ω×v（⊥v，弯向 −y）；「含离心力=1」再加 Ω²r 外甩。黄轨迹=转系路径。',
    concept: [
      '非惯性系：科里奥利 a_cor ⊥ v；离心 a_cf 沿径向向外。',
      'Ω>0 且初速沿 +x → 一开始 a_cor 沿 −y，轨迹右偏（俯视）。',
      '对比开关离心项，看路径如何被「外甩」拉直/拉弯。',
    ],
    objectives: [
      '看清粉箭头始终 ⊥ 绿速度箭头',
      '对照 |a_cor|=2|Ω||v|（Ω∥z）',
      '开关离心项比较路径',
    ],
    formulas: [
      '\\vec a_{\\mathrm{cor}}=-2\\vec\\Omega\\times\\vec v',
      '(a_x,a_y)=(2\\Omega v_y,-2\\Omega v_x)',
      '\\vec a_{\\mathrm{cf}}=\\Omega^2\\vec r_\\perp',
    ],
    insight:
      '灰盘+⊙=Ω；绿=v；粉=a_cor（与 v 成直角）；青=a_cf；紫虚线=初速方向。3D 中绿竖箭=Ω。',
    legend: [
      { color: '#94a3b8', label: '转盘 / Ω(⊙)' },
      { color: '#4ade80', label: '相对速度 v' },
      { color: '#f472b6', label: '科里奥利 a_cor' },
      { color: '#38bdf8', label: '离心 a_cf' },
      { id: 'compare', color: '#a78bfa', label: '初速方向' },
      { color: '#fbbf24', label: '质点 / 轨迹' },
    ],
    steps: [
      {
        id: 'cor',
        title: '科里奥利',
        body: 'a=−2Ω×v，与速度垂直；默认先关离心，只看弯曲。',
        formulas: ['\\vec a_{\\mathrm{cor}}=-2\\vec\\Omega\\times\\vec v'],
        bindings: [
          { labelTex: '\\Omega', valueKey: 'Omega', unit: '' },
          { labelTex: '|a_c|', valueKey: 'acmag', unit: '' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'deflect',
        title: '偏转',
        body: 'Ω>0 且 v 沿 +x 时，a_cor 沿 −y。',
        formulas: ['a_y=-2\\Omega v_x'],
        bindings: [
          { labelTex: 'v_x', valueKey: 'vx', unit: '' },
          { labelTex: 'a_{cy}', valueKey: 'acy', unit: '' },
        ],
      },
      {
        id: 'cf',
        title: '离心',
        body: '把「含离心力」调到 1，加上向外的 Ω²r。',
        formulas: ['a_{\\mathrm{cf}}=\\Omega^2 r'],
        bindings: [
          { labelTex: 'withCf', valueKey: 'withCf', unit: '' },
          { labelTex: 'r', valueKey: 'r', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'deflect-sign',
        prompt: '关离心（withCf=0），播放后使 y 明显为负（向 −y 偏）。',
        hint: '从原点沿 +x 抛出应弯向 −y。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'withCf', target: 0, tol: 0.2 },
            { kind: 'valueNear', key: 'y', target: -0.6, tol: 1.4 },
          ],
        },
      },
      {
        id: 'faster-spin',
        prompt: '把 Ω 调到约 1.5，使 |a_cor| 更大。',
        hint: '|a_cor|∝|Ω||v|。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'Omega', target: 1.5, tol: 0.4 },
            { kind: 'valueNear', key: 'acmag', target: 3, tol: 4 },
          ],
        },
      },
    ],
  },
}

export function registerCoriolisDemo(): void {
  registerDemoBundle({
    meta: coriolisMeta,
    model: createCoriolisModel,
    adapter: createCoriolisAdapter,
  })
}
