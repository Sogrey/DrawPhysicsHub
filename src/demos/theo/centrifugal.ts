import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCentrifugalAdapter } from './centrifugalAdapter'

/** 转系径向：ä = Ω² r（无摩擦，沿光滑径向槽） */
export function centrifugalAccel(Omega: number, r: number): number {
  return Omega * Omega * r
}

export function createCentrifugalModel(): PhysicsModel {
  let Omega = 1.2
  let r0 = 0.4
  let v0 = 0
  let t = 0
  const period = 4

  function stateAt(time: number) {
    // r(t) = A cosh(Ωt) + B sinh(Ωt)；r(0)=r0, ṙ(0)=v0
    const O = Math.max(0.05, Omega)
    const A = r0
    const B = v0 / O
    const T = Math.min(period, Math.max(0, time))
    const rRaw = A * Math.cosh(O * T) + B * Math.sinh(O * T)
    const r = Math.max(0.05, Math.min(3.5, rRaw))
    const vr = A * O * Math.sinh(O * T) + B * O * Math.cosh(O * T)
    const acf = centrifugalAccel(O, r)
    const Veff = -0.5 * O * O * r * r
    return { r, vr, acf, Veff, O }
  }

  return {
    init(params: ParamValues) {
      Omega = Number(params.Omega ?? 1.2)
      r0 = Number(params.r0 ?? 0.4)
      v0 = Number(params.v0 ?? 0)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      const phi = s.O * t // 惯性系张角示意
      return {
        time: t,
        values: {
          Omega: s.O,
          r0,
          v0,
          r: s.r,
          vr: s.vr,
          acf: s.acf,
          Veff: s.Veff,
          x: s.r * Math.cos(phi),
          y: s.r * Math.sin(phi),
          phi: (phi * 180) / Math.PI,
          period,
          tMax: period,
          world: Math.max(4, s.r + 1.2),
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.Omega !== undefined) Omega = Number(params.Omega)
      if (params.r0 !== undefined) r0 = Number(params.r0)
      if (params.v0 !== undefined) v0 = Number(params.v0)
    },
  }
}

export const centrifugalMeta: DemoMeta = {
  id: 'theo-centrifugal',
  subject: '理论力学',
  category: '转动参考系',
  tags: ['非惯性系', '离心力'],
  model: 'centrifugal',
  adapter: 'centrifugal',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'Omega', label: 'Ω', kind: 'number', default: 1.2, min: 0.4, max: 2.2, step: 0.1, unit: '' },
    { key: 'r0', label: '初径 r₀', kind: 'number', default: 0.4, min: 0.1, max: 1.5, step: 0.05, unit: '' },
    { key: 'v0', label: '初向速 ṙ₀', kind: 'number', default: 0, min: -0.5, max: 0.8, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '径向' },
    { id: 'scene3d', kind: 'three', title: '3D 转盘' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'r(t)',
      chartKey: 'r',
      charts: [
        {
          id: 'r',
          title: '径向运动',
          xLabel: 't (s)',
          leftLabel: 'r',
          series: [
            { key: 'r', label: 'r', color: '#fbbf24', unit: '' },
            { key: 'Veff', label: 'V_eff', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'r', label: 'r', unit: '', tone: 'amber' },
    { key: 'acf', label: 'a_cf', unit: '', tone: 'pink' },
    { key: 'Veff', label: 'V_eff', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '离心力与有效势对照',
    summary:
      '光滑径向槽上的质点：转系中 ä=Ω²r，等效 V_eff=−½Ω²r²（不稳定，向外甩）。对照科里奥利演示的切向弯曲。',
    concept: [
      '离心加速度沿径向向外 Ω²r',
      '有效势下凹 → 平衡点 r=0 不稳定',
      '解析解含 cosh/sinh（指数外甩）',
    ],
    objectives: ['观察 r(t) 外甩', '对照 V_eff', '与科里奥利演示区分径向/切向效应'],
    formulas: ['a_{cf}=\\Omega^2 r', 'V_{\\mathrm{eff}}=-\\tfrac12\\Omega^2 r^2'],
    insight: '金点沿槽外移；紫曲线为 V_eff。Ω 越大甩得越快。',
    legend: [
      { color: '#fbbf24', label: '质点' },
      { color: '#f472b6', label: 'a_cf' },
      { color: '#a78bfa', label: 'V_eff' },
    ],
    steps: [
      {
        id: 'out',
        title: '外甩',
        body: '播放看 r 增大；提高 Ω 加速。',
        formulas: ['r\\sim e^{\\Omega t}\\ (\\text{渐近})'],
        bindings: [
          { labelTex: 'r', valueKey: 'r', unit: '' },
          { labelTex: '\\Omega', valueKey: 'Omega', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'far',
        prompt: '默认参数播放，使 r>2。',
        hint: '等一会儿即可。',
        check: { kind: 'valueNear', key: 'r', target: 2.5, tol: 2 },
      },
    ],
  },
}

export function registerCentrifugalDemo(): void {
  registerDemoBundle({
    meta: centrifugalMeta,
    model: createCentrifugalModel,
    adapter: createCentrifugalAdapter,
  })
}
