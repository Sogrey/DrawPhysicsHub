import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createLenzAdapter } from './lenzAdapter'

/**
 * 磁通量 / 楞次定律（教学单位）：
 *   固定面积 A 的平面线圈，匀强 B(t)=Bₐ sin(ωt) 垂直纸面（+ 为出纸面）。
 *   Φ=B A，ε=−dΦ/dt，I=ε/R。
 *   ε>0 → 逆时针感应电流；ε<0 → 顺时针（与楞次：反抗磁通变化一致）。
 */
export function createLenzModel(): PhysicsModel {
  let A = 4
  let Bamp = 1.2
  let R = 1
  let omega = 1
  let t = 0

  function period() {
    return (2 * Math.PI) / Math.max(1e-9, omega)
  }

  function stateAt(time: number) {
    const B = Bamp * Math.sin(omega * time)
    const dBdt = Bamp * omega * Math.cos(omega * time)
    const Phi = B * A
    const emf = -A * dBdt
    const I = emf / Math.max(1e-9, R)
    // +1 CCW, −1 CW
    const sense = Math.abs(I) < 1e-6 ? 0 : I > 0 ? 1 : -1
    return { B, dBdt, Phi, emf, I, sense }
  }

  return {
    init(params: ParamValues) {
      A = Number(params.A ?? 4)
      Bamp = Number(params.Bamp ?? 1.2)
      R = Number(params.R ?? 1)
      omega = Number(params.omega ?? 1)
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
      const s = stateAt(t)
      const T = period()
      const side = Math.sqrt(Math.max(A, 1e-9))
      return {
        time: t,
        values: {
          A,
          Bamp,
          R,
          omega,
          B: s.B,
          dBdt: s.dBdt,
          Phi: s.Phi,
          emf: s.emf,
          I: s.I,
          sense: s.sense,
          side,
          period: T,
          tMax: T,
          world: Math.max(4, side * 1.4 + 1.2),
          Bout: s.B >= 0 ? 1 : 0,
          done: t >= T - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.A !== undefined) A = Number(params.A)
      if (params.Bamp !== undefined) Bamp = Number(params.Bamp)
      if (params.R !== undefined) R = Number(params.R)
      if (params.omega !== undefined) omega = Number(params.omega)
    },
  }
}

export const lenzMeta: DemoMeta = {
  id: 'em-lenz',
  subject: '电磁学',
  category: '电磁感应',
  tags: ['感应', '楞次', '磁通量'],
  model: 'lenz',
  adapter: 'lenz',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'A',
      label: '面积 A',
      kind: 'number',
      default: 4,
      min: 1,
      max: 9,
      step: 0.5,
      unit: 'm²',
    },
    {
      key: 'Bamp',
      label: 'B 振幅',
      kind: 'number',
      default: 1.2,
      min: 0.2,
      max: 2.5,
      step: 0.1,
      unit: 'u',
    },
    {
      key: 'R',
      label: '电阻 R',
      kind: 'number',
      default: 1,
      min: 0.3,
      max: 3,
      step: 0.1,
      unit: 'Ω',
    },
    {
      key: 'omega',
      label: '角频率 ω',
      kind: 'number',
      default: 1,
      min: 0.4,
      max: 2,
      step: 0.1,
      unit: 'rad/s',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '感应' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'Phi',
      charts: [
        {
          id: 'flux',
          title: '磁通与感应电动势',
          xLabel: 't (s)',
          leftLabel: 'Φ / ε',
          series: [
            { key: 'Phi', label: 'Φ', color: '#60a5fa', unit: 'u·m²' },
            { key: 'emf', label: 'ε', color: '#f472b6', unit: 'u' },
          ],
        },
        {
          id: 'current',
          title: '感应电流',
          xLabel: 't (s)',
          leftLabel: 'I',
          series: [
            { key: 'I', label: 'I', color: '#34d399', unit: 'A' },
            { key: 'B', label: 'B', color: '#fbbf24', unit: 'u' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'B', label: 'B', unit: 'u', tone: 'amber' },
    { key: 'Phi', label: 'Φ', unit: 'u·m²', tone: 'blue' },
    { key: 'emf', label: 'ε', unit: 'u', tone: 'purple' },
    { key: 'I', label: 'I', unit: 'A', tone: 'green' },
    { key: 'sense', label: '旋向', unit: '', tone: 'slate' },
  ],
  docs: {
    title: '磁通量 / 楞次定律',
    summary:
      '固定面积线圈中，B(t)=Bₐ sin(ωt) 垂直纸面变化。Φ=BA，ε=−dΦ/dt，I=ε/R。线圈上箭头为感应电流方向：反抗磁通变化（楞次定律）。',
    concept: [
      '磁通量 Φ = B A（B 与面法向平行时）。',
      '法拉第电磁感应：ε = −dΦ/dt。',
      '楞次定律：感应电流的磁场总是反抗引起感应的磁通变化。',
    ],
    objectives: [
      '对照 Φ 与 ε 的相位（ε ∝ −dΦ/dt）',
      '从电流箭头读出楞次方向',
      '改变 A、Bₐ、R 观察 |ε|、|I|',
    ],
    formulas: [
      '\\Phi=BA',
      '\\mathcal{E}=-\\dfrac{d\\Phi}{dt}',
      'I=\\mathcal{E}/R',
    ],
    insight:
      'B 增强出纸面时，感应电流顺时针以产生入纸面磁场；B 减弱则相反。绿箭头=电流方向。',
    legend: [
      { color: '#94a3b8', label: 'B（·出 / ×入）' },
      { color: '#fbbf24', label: '线圈' },
      { color: '#34d399', label: '感应电流方向' },
    ],
    steps: [
      {
        id: 'flux',
        title: '磁通量',
        body: '穿过线圈的磁通 Φ=BA。',
        formulas: ['\\Phi=B A'],
        bindings: [
          { labelTex: 'B', valueKey: 'B', unit: 'u' },
          { labelTex: 'A', valueKey: 'A', unit: 'm²' },
          { labelTex: '\\Phi', valueKey: 'Phi', unit: 'u·m²' },
        ],
      },
      {
        id: 'faraday',
        title: '法拉第定律',
        body: '感应电动势等于磁通变化率的负值。',
        formulas: ['\\mathcal{E}=-d\\Phi/dt', 'I=\\mathcal{E}/R'],
        bindings: [
          { labelTex: '\\mathcal{E}', valueKey: 'emf', unit: 'u' },
          { labelTex: 'I', valueKey: 'I', unit: 'A' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'lenz',
        title: '楞次定律',
        body: '感应电流产生的磁场反抗磁通变化。',
        formulas: ['\\Delta\\Phi\\uparrow(\\cdot)\\Rightarrow I\\text{ 顺时针}'],
        bindings: [{ labelTex: 'sense', valueKey: 'sense', unit: '' }],
      },
    ],
    challenges: [
      {
        id: 'emf-amp',
        prompt: '取 A=4、Bₐ=1.2、ω=1，把时间拖到 t≈0，使 ε≈−4.8（峰值）。',
        hint: 'ε=−A Bₐ ω cos(ωt)，t=0 时 |ε| 最大。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'A', target: 4, tol: 0.2 },
            { kind: 'paramNear', key: 'Bamp', target: 1.2, tol: 0.15 },
            { kind: 'paramNear', key: 'omega', target: 1, tol: 0.1 },
            { kind: 'valueNear', key: 't', target: 0, tol: 0.4 },
            { kind: 'valueNear', key: 'emf', target: -4.8, tol: 0.7 },
          ],
        },
      },
      {
        id: 'lenz-sense',
        prompt: '在 t≈0（B 由 0 增大出纸面）时，确认感应电流为顺时针（sense≈−1）。',
        hint: '磁通出纸面增加 → 感应电流产生入纸面场 → 顺时针。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 't', target: 0, tol: 0.35 },
            { kind: 'valueNear', key: 'sense', target: -1, tol: 0.2 },
          ],
        },
      },
    ],
  },
}

export function registerLenzDemo(): void {
  registerDemoBundle({
    meta: lenzMeta,
    model: createLenzModel,
    adapter: createLenzAdapter,
  })
}
