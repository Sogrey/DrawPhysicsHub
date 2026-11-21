import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createMalusAdapter } from './malusAdapter'

/**
 * 马吕斯定律（起偏 + 检偏）：
 *   自然光经起偏器后强度 I₁ = I₀/2，偏振方向 θₚ；
 *   再经检偏器（透振方向 θₐ）：I₂ = I₁ cos²(θ)，θ = θₐ − θₚ。
 * 动画：检偏器匀速转动，读出 I(θ)。
 */
export function createMalusModel(): PhysicsModel {
  let I0 = 1
  let thetaP = 0 // degrees
  let t = 0

  function period() {
    return 6 // one full 360° turn of analyzer
  }

  function stateAt(time: number) {
    const T = period()
    const thetaA = (360 * time) / T // 0→360
    let theta = thetaA - thetaP
    // wrap to [-180,180] for display
    while (theta > 180) theta -= 360
    while (theta < -180) theta += 360
    const thetaRad = (theta * Math.PI) / 180
    const I1 = I0 / 2
    const cos2 = Math.cos(thetaRad) ** 2
    const I2 = I1 * cos2
    return { thetaA, theta, thetaRad, I1, I2, cos2 }
  }

  return {
    init(params: ParamValues) {
      I0 = Number(params.I0 ?? 1)
      thetaP = Number(params.thetaP ?? 0)
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
      return {
        time: t,
        values: {
          I0,
          thetaP,
          thetaA: s.thetaA,
          theta: s.theta,
          I1: s.I1,
          I2: s.I2,
          cos2: s.cos2,
          period: T,
          tMax: T,
          world: 5,
          done: t >= T - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.I0 !== undefined) I0 = Number(params.I0)
      if (params.thetaP !== undefined) thetaP = Number(params.thetaP)
    },
  }
}

export const malusMeta: DemoMeta = {
  id: 'opt-malus',
  subject: '光学',
  category: '偏振',
  tags: ['偏振', '马吕斯', '起偏', '检偏'],
  model: 'malus',
  adapter: 'malus',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
    cameraPresets: [
      {
        id: 'beam',
        label: '光路侧视',
        lookAt: [2.5, 0, 0],
        yaw: 0.15,
        pitch: 0.22,
        distance: 11,
      },
      {
        id: 'face',
        label: '迎面看轴',
        lookAt: [2.5, 0, 0],
        yaw: 1.45,
        pitch: 0.08,
        distance: 10,
      },
      {
        id: 'orbit',
        label: '斜俯视',
        lookAt: [2.5, 0, 0],
        yaw: 0.55,
        pitch: 0.55,
        distance: 13,
      },
    ],
  },
  params: [
    {
      key: 'I0',
      label: '入射强度 I₀',
      kind: 'number',
      default: 1,
      min: 0.2,
      max: 2,
      step: 0.1,
      unit: '',
    },
    {
      key: 'thetaP',
      label: '起偏轴 θₚ',
      kind: 'number',
      default: 0,
      min: -90,
      max: 90,
      step: 5,
      unit: '°',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '偏振' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'I2',
      charts: [
        {
          id: 'intensity',
          title: '透射强度',
          xLabel: 't (s)',
          leftLabel: 'I',
          series: [
            { key: 'I2', label: 'I₂', color: '#38bdf8', unit: '' },
            { key: 'cos2', label: 'cos²θ', color: '#fbbf24', unit: '' },
            { key: 'theta', label: 'θ', color: '#a78bfa', unit: '°' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'purple' },
    { key: 'I1', label: 'I₁', unit: '', tone: 'amber' },
    { key: 'I2', label: 'I₂', unit: '', tone: 'blue' },
    { key: 'cos2', label: 'cos²θ', unit: '', tone: 'green' },
    { key: 'thetaA', label: 'θₐ', unit: '°', tone: 'slate' },
  ],
  docs: {
    title: '偏振片起偏检偏（马吕斯）',
    summary:
      '自然光经起偏器得线偏光 I₁=I₀/2；检偏器相对转角 θ 时透射 I₂=I₁ cos²θ（马吕斯）。播放时检偏器旋转一周。',
    concept: [
      '自然光各向振动；起偏后成为线偏振光（双箭头），强度 I₁=I₀/2。',
      '检偏器相对转角 θ：I₂=I₁ cos²θ（马吕斯）。',
      '平行 → 最亮；夹角 → ∝cos²θ；垂直 → 消光为零。',
    ],
    objectives: [
      '对照 I₂ 与 cos²θ 同步变化',
      '在 θ≈0° / 90° 观察最亮与消光',
      '改变 θₚ 看相对夹角仍决定强度',
    ],
    formulas: [
      'I_1=I_0/2',
      'I_2=I_1\\cos^2\\theta',
      '\\theta=\\theta_a-\\theta_p',
    ],
    insight:
      '左侧星芒=自然光各向振动；起偏后只剩线偏光双箭头；检偏器旋转时屏上光斑明暗按 cos²θ 变化（平行最亮、正交消光）。',
    legend: [
      { color: '#94a3b8', label: '自然光（各向 / ·⊥纸面）' },
      { color: '#4ade80', label: '线偏振光' },
      { color: '#a78bfa', label: '起偏器' },
      { color: '#38bdf8', label: '检偏器（可转）' },
      { color: '#7dd3fc', label: '屏上光斑 I₂' },
    ],
    steps: [
      {
        id: 'polarize',
        title: '起偏',
        body: '自然光通过起偏器成为线偏光，理想强度减半。',
        formulas: ['I_1=I_0/2'],
        bindings: [
          { labelTex: 'I_0', valueKey: 'I0', unit: '' },
          { labelTex: 'I_1', valueKey: 'I1', unit: '' },
          { labelTex: '\\theta_p', valueKey: 'thetaP', unit: '°' },
        ],
      },
      {
        id: 'malus',
        title: '马吕斯',
        body: '检偏器透振方向与起偏轴夹角为 θ 时，透射强度按 cos²θ 变化。',
        formulas: ['I_2=I_1\\cos^2\\theta'],
        bindings: [
          { labelTex: '\\theta', valueKey: 'theta', unit: '°' },
          { labelTex: '\\cos^2\\theta', valueKey: 'cos2', unit: '' },
          { labelTex: 'I_2', valueKey: 'I2', unit: '' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'extinction',
        title: '消光',
        body: '两轴正交（|θ|=90°）时理想消光。',
        formulas: ['\\theta=\\pm 90^\\circ\\Rightarrow I_2=0'],
        bindings: [{ labelTex: '\\theta', valueKey: 'theta', unit: '°' }],
      },
    ],
    challenges: [
      {
        id: 'bright',
        prompt: '把时间拖到使 |θ|≈0°（或 180°），使 I₂≈I₁≈0.5（I₀=1）。',
        hint: '检偏轴与起偏轴平行时最亮。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'I0', target: 1, tol: 0.15 },
            { kind: 'valueNear', key: 'theta', target: 0, tol: 12 },
            { kind: 'valueNear', key: 'I2', target: 0.5, tol: 0.08 },
          ],
        },
      },
      {
        id: 'extinct',
        prompt: '拖到 |θ|≈90°，使 I₂≈0（消光）。',
        hint: '正交消光；也可看 cos²θ≈0。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'cos2', target: 0, tol: 0.08 },
            { kind: 'valueNear', key: 'I2', target: 0, tol: 0.06 },
          ],
        },
      },
    ],
  },
}

export function registerMalusDemo(): void {
  registerDemoBundle({
    meta: malusMeta,
    model: createMalusModel,
    adapter: createMalusAdapter,
  })
}
