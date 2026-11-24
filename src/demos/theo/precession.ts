import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createPrecessionAdapter } from './precessionAdapter'

/** 对称陀螺稳态进动：Ω_p ≈ M g h / (I₃ ω₃)（快速陀螺近似） */
export function precessionRate(M: number, g: number, h: number, I3: number, omega3: number): number {
  return (M * g * h) / Math.max(1e-6, I3 * Math.abs(omega3))
}

export function createPrecessionModel(): PhysicsModel {
  let omega3 = 12
  let tiltDeg = 25
  let Mh = 1.2 // M g h 合并为有效力矩系数（教学单位 g=1 → Mh≈M*h）
  let I3 = 1
  let t = 0
  const period = 10

  return {
    init(params: ParamValues) {
      omega3 = Number(params.omega3 ?? 12)
      tiltDeg = Number(params.tilt ?? 25)
      Mh = Number(params.Mh ?? 1.2)
      I3 = Number(params.I3 ?? 1)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const tilt = (tiltDeg * Math.PI) / 180
      const OmP = precessionRate(1, 1, Mh, I3, omega3)
      const phi = OmP * t
      // 自旋轴尖端在倾角圆锥上
      const L = 2.2
      const ax = L * Math.sin(tilt) * Math.cos(phi)
      const ay = L * Math.cos(tilt)
      const az = L * Math.sin(tilt) * Math.sin(phi)
      return {
        time: t,
        values: {
          omega3,
          tiltDeg,
          Mh,
          I3,
          OmP,
          phi: (phi * 180) / Math.PI,
          ax,
          ay,
          az,
          period,
          tMax: period,
          world: 3.2,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.omega3 !== undefined) omega3 = Number(params.omega3)
      if (params.tilt !== undefined) tiltDeg = Number(params.tilt)
      if (params.Mh !== undefined) Mh = Number(params.Mh)
      if (params.I3 !== undefined) I3 = Number(params.I3)
    },
  }
}

export const precessionMeta: DemoMeta = {
  id: 'theo-precession',
  subject: '理论力学',
  category: '刚体动力学',
  tags: ['进动', '角动量', '陀螺'],
  model: 'precession',
  adapter: 'precession',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'omega3', label: '自旋 ω₃', kind: 'number', default: 12, min: 4, max: 24, step: 0.5, unit: '' },
    { key: 'tilt', label: '倾角 θ', kind: 'number', default: 25, min: 5, max: 60, step: 1, unit: '°' },
    { key: 'Mh', label: '力矩系数 Mgh', kind: 'number', default: 1.2, min: 0.4, max: 2.5, step: 0.1, unit: '' },
    { key: 'I3', label: 'I₃', kind: 'number', default: 1, min: 0.5, max: 2, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '进动' },
    { id: 'scene3d', kind: 'three', title: '3D 陀螺' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'Ωₚ',
      chartKey: 'OmP',
      charts: [
        {
          id: 'omp',
          title: '进动角速度',
          xLabel: 't (s)',
          leftLabel: 'Ωₚ',
          series: [{ key: 'OmP', label: 'Ωₚ', color: '#a78bfa', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'OmP', label: 'Ωₚ', unit: '', tone: 'purple' },
    { key: 'phi', label: 'φ', unit: '°', tone: 'amber' },
    { key: 'omega3', label: 'ω₃', unit: '', tone: 'blue' },
  ],
  docs: {
    title: '刚体进动（陀螺）示意',
    summary: '快速对称陀螺稳态进动：Ωₚ≈Mgh/(I₃ω₃)。自旋越快进动越慢。播放看轴尖在圆锥上扫过。',
    concept: [
      '重力力矩 ⊥ 角动量 → 进动而非倾倒',
      'Ωₚ 与 ω₃ 成反比（快陀螺）',
      '倾角 θ 决定圆锥开角',
    ],
    objectives: ['验证 Ωₚ∝1/ω₃', '观察轴尖圆锥轨迹', '理解力矩改变 L 的方向'],
    formulas: ['\\Omega_p\\approx\\frac{Mgh}{I_3\\omega_3}', '\\vec\\tau=\\vec\\omega_p\\times\\vec L'],
    insight: '金轴=自旋轴；紫环=进动圆锥。调大 ω₃ 看进动变慢。',
    legend: [
      { color: '#fbbf24', label: '自旋轴' },
      { color: '#a78bfa', label: '进动' },
      { color: '#38bdf8', label: '竖直参考' },
    ],
    steps: [
      {
        id: 'rate',
        title: '进动快慢',
        body: '增大 ω₃，读 Ωₚ 下降。',
        formulas: ['\\Omega_p\\propto 1/\\omega_3'],
        bindings: [
          { labelTex: '\\omega_3', valueKey: 'omega3', unit: '' },
          { labelTex: '\\Omega_p', valueKey: 'OmP', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'slow',
        prompt: '取 ω₃≈20，使 Ωₚ 明显小于默认。',
        hint: 'Ωₚ∝1/ω₃。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'omega3', target: 20, tol: 5 },
            { kind: 'valueNear', key: 'OmP', target: 0.06, tol: 0.08 },
          ],
        },
      },
    ],
  },
}

export function registerPrecessionDemo(): void {
  registerDemoBundle({
    meta: precessionMeta,
    model: createPrecessionModel,
    adapter: createPrecessionAdapter,
  })
}
