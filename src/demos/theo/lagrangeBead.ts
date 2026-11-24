import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createLagrangeBeadAdapter } from './lagrangeBeadAdapter'

/**
 * 光滑直杆以角速度 Ω 绕竖直轴旋转，珠子沿杆滑动。
 * 广义坐标 r：L = ½m(ṙ² + r²Ω²) − ½m g·0（水平杆）
 * 方程：r̈ − Ω² r = 0 ⇒ r(t)=A e^{Ωt}+B e^{−Ωt} 或 r=r0 cosh(Ωt)+ (v0/Ω)sinh(Ωt)
 */
export function beadR(Omega: number, r0: number, v0: number, t: number): { r: number; vr: number } {
  const Om = Math.max(1e-6, Omega)
  const ch = Math.cosh(Om * t)
  const sh = Math.sinh(Om * t)
  const r = r0 * ch + (v0 / Om) * sh
  const vr = Om * r0 * sh + v0 * ch
  return { r: Math.max(0.05, Math.min(3.2, r)), vr }
}

export function createLagrangeBeadModel(): PhysicsModel {
  let Omega = 1.1
  let r0 = 0.5
  let v0 = 0
  let gHint = 0 // reserved for tilted wire later
  let t = 0
  const period = 5
  let trail: number[][] = []

  function stateAt(time: number) {
    const T = Math.min(period, Math.max(0, time))
    const { r, vr } = beadR(Omega, r0, v0, T)
    const phi = Omega * T
    const x = r * Math.cos(phi)
    const y = r * Math.sin(phi)
    trail = []
    const n = Math.max(2, Math.ceil(T / 0.04))
    for (let i = 0; i <= n; i++) {
      const ti = (T * i) / n
      const s = beadR(Omega, r0, v0, ti)
      const ph = Omega * ti
      trail.push([s.r * Math.cos(ph), s.r * Math.sin(ph)])
    }
    return { r, vr, phi, x, y, L: 0.5 * (vr * vr + r * r * Omega * Omega) }
  }

  return {
    init(params: ParamValues) {
      Omega = Number(params.Omega ?? 1.1)
      r0 = Number(params.r0 ?? 0.5)
      v0 = Number(params.v0 ?? 0)
      gHint = Number(params.tilt ?? 0)
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
          r0,
          v0,
          tilt: gHint,
          r: s.r,
          vr: s.vr,
          phiDeg: (s.phi * 180) / Math.PI,
          x: s.x,
          y: s.y,
          Lagr: s.L,
          period,
          tMax: period,
          world: 3.6,
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
      if (params.r0 !== undefined) r0 = Number(params.r0)
      if (params.v0 !== undefined) v0 = Number(params.v0)
      if (params.tilt !== undefined) gHint = Number(params.tilt)
    },
  }
}

export const lagrangeBeadMeta: DemoMeta = {
  id: 'theo-lagrange-bead',
  subject: '理论力学',
  category: '分析力学',
  tags: ['拉格朗日', '约束', '广义坐标'],
  model: 'lagrangeBead',
  adapter: 'lagrangeBead',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'Omega', label: '杆角速度 Ω', kind: 'number', default: 1.1, min: 0.4, max: 2, step: 0.1, unit: '' },
    { key: 'r0', label: '初径 r₀', kind: 'number', default: 0.5, min: 0.15, max: 1.5, step: 0.05, unit: '' },
    { key: 'v0', label: '初速 ṙ₀', kind: 'number', default: 0, min: -0.5, max: 0.8, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '俯视' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'r(t)',
      chartKey: 'r',
      charts: [
        {
          id: 'r',
          title: '径向坐标',
          xLabel: 't (s)',
          leftLabel: 'r',
          series: [
            { key: 'r', label: 'r', color: '#fbbf24', unit: '' },
            { key: 'Lagr', label: 'L', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'r', label: 'r', unit: '', tone: 'amber' },
    { key: 'vr', label: 'ṙ', unit: '', tone: 'green' },
    { key: 'Omega', label: 'Ω', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '拉格朗日珠（旋转杆）',
    summary:
      '光滑直杆绕竖直轴以 Ω 转动，珠子沿杆为唯一自由度 r。拉格朗日方程给出 r̈=Ω²r，解为双曲增长——与离心有效势下凹一致。',
    concept: [
      '约束：珠在杆上 → 广义坐标仅 r',
      'L=T−V：水平杆 V=0，T=½m(ṙ²+r²Ω²)',
      '欧拉-拉格朗日 ⇒ r̈−Ω²r=0',
    ],
    objectives: ['理解广义坐标降维', '观察 r 指数/双曲外逃', '对照离心力演示'],
    formulas: ['L=\\tfrac12 m(\\dot r^2+r^2\\Omega^2)', '\\ddot r-\\Omega^2 r=0'],
    insight: '黄=杆，青=珠，轨迹螺旋外扩。分析力学：不必显式写约束力。',
    legend: [
      { color: '#fbbf24', label: '旋转杆' },
      { color: '#38bdf8', label: '珠' },
      { color: '#a78bfa', label: '轨迹' },
    ],
    steps: [
      {
        id: 'eq',
        title: '方程',
        body: '从静止 r₀>0 出发，r(t)=r₀ cosh(Ωt)。',
        formulas: ['r(t)=r_0\\cosh(\\Omega t)'],
        bindings: [
          { labelTex: 'r', valueKey: 'r', unit: '' },
          { labelTex: '\\Omega', valueKey: 'Omega', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'flyout',
        prompt: '从静止出发，播放至 r 明显大于 r₀。',
        hint: 'Ω 越大外逃越快。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'v0', target: 0, tol: 0.15 },
            { kind: 'valueNear', key: 't', target: 1.5, tol: 4 },
          ],
        },
      },
    ],
  },
}

export function registerLagrangeBeadDemo(): void {
  registerDemoBundle({
    meta: lagrangeBeadMeta,
    model: createLagrangeBeadModel,
    adapter: createLagrangeBeadAdapter,
  })
}
