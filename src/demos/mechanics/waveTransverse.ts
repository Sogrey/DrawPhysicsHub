import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createWaveTransverseAdapter } from './waveTransverseAdapter'

/**
 * 行进横波（向 +x）：
 *   y(x,t) = A cos(kx − ωt)， k=2π/λ，ω=2π/T，相速 v=λ/T=ω/k
 */
export function createWaveTransverseModel(): PhysicsModel {
  let A = 1
  let lambda = 4
  let period = 2
  let t = 0

  const X_MIN = 0
  const X_MAX = 12
  const N_SAMPLES = 120

  function k() {
    return (2 * Math.PI) / Math.max(1e-9, lambda)
  }

  function omega() {
    return (2 * Math.PI) / Math.max(1e-9, period)
  }

  function phaseSpeed() {
    return lambda / Math.max(1e-9, period)
  }

  function yAt(x: number, time: number) {
    return A * Math.cos(k() * x - omega() * time)
  }

  function vyAt(x: number, time: number) {
    return A * omega() * Math.sin(k() * x - omega() * time)
  }

  function profile(time: number): number[][] {
    const pts: number[][] = []
    for (let i = 0; i <= N_SAMPLES; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / N_SAMPLES
      pts.push([x, yAt(x, time)])
    }
    return pts
  }

  return {
    init(params: ParamValues) {
      A = Number(params.A ?? 1)
      lambda = Number(params.lambda ?? 4)
      period = Number(params.period ?? 2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const w = omega()
      const kk = k()
      const v = phaseSpeed()
      const xProbe = lambda // 一个波长处的质点
      const y0 = yAt(0, t)
      const yP = yAt(xProbe, t)
      const vy0 = vyAt(0, t)
      return {
        time: t,
        values: {
          A,
          lambda,
          period,
          omega: w,
          k: kk,
          v,
          f: 1 / Math.max(1e-9, period),
          y0,
          vy0,
          yProbe: yP,
          xProbe,
          xMin: X_MIN,
          xMax: X_MAX,
          tMax: period,
          checkV: v - w / kk,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: profile(t) },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.A !== undefined) A = Number(params.A)
      if (params.lambda !== undefined) lambda = Number(params.lambda)
      if (params.period !== undefined) period = Number(params.period)
    },
  }
}

export const waveTransverseMeta: DemoMeta = {
  id: 'mech-wave-transverse',
  subject: '力学',
  category: '波动',
  tags: ['波动', '传播', '横波', '相速'],
  model: 'waveTransverse',
  adapter: 'waveTransverse',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'A',
      label: '振幅 A',
      kind: 'number',
      default: 1,
      min: 0.3,
      max: 2,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'lambda',
      label: '波长 λ',
      kind: 'number',
      default: 4,
      min: 2,
      max: 8,
      step: 0.2,
      unit: 'm',
    },
    {
      key: 'period',
      label: '周期 T',
      kind: 'number',
      default: 2,
      min: 0.8,
      max: 5,
      step: 0.1,
      unit: 's',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '波形' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'y0',
      charts: [
        {
          id: 'probe',
          title: '定点振动 y(0,t) / y(λ,t)',
          xLabel: 't (s)',
          leftLabel: 'y (m)',
          series: [
            { key: 'y0', label: 'y(0)', color: '#38bdf8', unit: 'm' },
            { key: 'yProbe', label: 'y(λ)', color: '#fbbf24', unit: 'm' },
          ],
        },
        {
          id: 'vel',
          title: 'x=0 处质点横向速度',
          xLabel: 't (s)',
          leftLabel: 'vᵧ (m/s)',
          series: [{ key: 'vy0', label: 'vᵧ(0)', color: '#4ade80', unit: 'm/s' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'v', label: 'v', unit: 'm/s', tone: 'green' },
    { key: 'lambda', label: 'λ', unit: 'm', tone: 'amber' },
    { key: 'period', label: 'T', unit: 's', tone: 'blue' },
    { key: 'y0', label: 'y(0)', unit: 'm', tone: 'slate' },
    { key: 'f', label: 'f', unit: 'Hz', tone: 'purple' },
  ],
  docs: {
    title: '横波形成与传播',
    summary:
      '一列向右传播的简谐横波。观察波形平移、波长 λ、周期 T 与相速 v=λ/T；固定 x 的质点只做横向振动。',
    concept: [
      '横波中质点位移垂直于传播方向；行波整体形状以相速 v 平移，但介质质点并不随波迁移。',
      'y(x,t)=A cos(kx−ωt) 表示向 +x 传播；k=2π/λ，ω=2π/T，v=ω/k=λ/T。',
      '同一时刻相邻波峰间距为 λ；同一地点相邻波峰时间间隔为 T。',
    ],
    objectives: [
      '区分波形传播与质点振动',
      '从 λ、T 读出相速 v',
      '对照 x=0 与 x=λ 两质点振动相位',
    ],
    formulas: [
      'y(x,t)=A\\cos(kx-\\omega t)',
      'k=\\dfrac{2\\pi}{\\lambda},\\quad \\omega=\\dfrac{2\\pi}{T}',
      'v=\\dfrac{\\lambda}{T}=\\dfrac{\\omega}{k}',
    ],
    insight:
      '青线为当前波形；金点为 x=0 与 x=λ 的质点。拖动时间看波形右移，两质点应同相位（相距一波长）。',
    legend: [
      { color: '#38bdf8', label: '波形 y(x)' },
      { id: 'compare', color: '#f472b6', label: 't=0 参考波形' },
      { color: '#fbbf24', label: '示踪质点' },
      { color: '#a78bfa', label: '波长 λ' },
    ],
    steps: [
      {
        id: 'form',
        title: '行波方程',
        body: '振幅、波长、周期决定波形与快慢。',
        formulas: ['y=A\\cos(kx-\\omega t)', 'k=2\\pi/\\lambda', '\\omega=2\\pi/T'],
        bindings: [
          { labelTex: 'A', valueKey: 'A', unit: 'm' },
          { labelTex: '\\lambda', valueKey: 'lambda', unit: 'm' },
          { labelTex: 'T', valueKey: 'period', unit: 's' },
        ],
      },
      {
        id: 'speed',
        title: '相速',
        body: '波峰（等相位面）沿 x 的移动速度。',
        formulas: ['v=\\lambda/T=\\omega/k'],
        bindings: [
          { labelTex: 'v', valueKey: 'v', unit: 'm/s' },
          { labelTex: 'f', valueKey: 'f', unit: 'Hz' },
          { labelTex: 'k', valueKey: 'k', unit: 'rad/m' },
          { labelTex: '\\omega', valueKey: 'omega', unit: 'rad/s' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'particle',
        title: '定点振动',
        body: '固定 x 只看时间：该处质点做横向简谐振动，并不沿 x 漂移。',
        formulas: ['y(0,t)=A\\cos(-\\omega t)', 'y(\\lambda,t)=y(0,t)'],
        bindings: [
          { labelTex: 'y(0)', valueKey: 'y0', unit: 'm' },
          { labelTex: 'y(\\lambda)', valueKey: 'yProbe', unit: 'm' },
          { labelTex: 'v_y(0)', valueKey: 'vy0', unit: 'm/s' },
        ],
      },
    ],
    challenges: [
      {
        id: 'v-from-params',
        prompt: '令 λ=4、T=2，使相速 v≈2 m/s。',
        hint: 'v=λ/T=4/2=2。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'lambda', target: 4, tol: 0.08 },
            { kind: 'paramNear', key: 'period', target: 2, tol: 0.08 },
            { kind: 'valueNear', key: 'v', target: 2, tol: 0.12 },
          ],
        },
      },
      {
        id: 'check-dispersion',
        prompt: '验证 v = ω/k（残差 checkV≈0）。',
        hint: '由定义保证；读数 checkV 应接近 0。',
        check: { kind: 'valueNear', key: 'checkV', target: 0, tol: 0.05 },
      },
    ],
  },
}

export function registerWaveTransverseDemo(): void {
  registerDemoBundle({
    meta: waveTransverseMeta,
    model: createWaveTransverseModel,
    adapter: createWaveTransverseAdapter,
  })
}
