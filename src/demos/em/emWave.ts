import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createEmWaveAdapter } from './emWaveAdapter'

/** 平面电磁波：E=Ê cos(kz−ωt)，B=̂B cos(kz−ωt)，c=ω/k，S∝E×B */
export function emWaveFields(
  A: number,
  k: number,
  omega: number,
  z: number,
  t: number,
): { E: number; B: number; phase: number } {
  const phase = k * z - omega * t
  const E = A * Math.cos(phase)
  const B = A * Math.cos(phase) // 教学单位 c=1 → |B|=|E|
  return { E, B, phase }
}

export function createEmWaveModel(): PhysicsModel {
  let A = 1
  let lambda = 4
  let period = 3
  let t = 0
  const playPeriod = 6
  const Z_MIN = 0
  const Z_MAX = 12
  const N = 80

  function k() {
    return (2 * Math.PI) / Math.max(1e-9, lambda)
  }
  function omega() {
    return (2 * Math.PI) / Math.max(1e-9, period)
  }

  return {
    init(params: ParamValues) {
      A = Number(params.A ?? 1)
      lambda = Number(params.lambda ?? 4)
      period = Number(params.period ?? 3)
      t = 0
    },
    step(dt: number) {
      t = Math.min(playPeriod, t + dt)
    },
    seek(time: number) {
      t = Math.min(playPeriod, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const kk = k()
      const w = omega()
      const c = w / kk
      const eProfile: number[][] = []
      const bProfile: number[][] = []
      for (let i = 0; i <= N; i++) {
        const z = Z_MIN + ((Z_MAX - Z_MIN) * i) / N
        const f = emWaveFields(A, kk, w, z, t)
        eProfile.push([z, f.E])
        bProfile.push([z, f.B])
      }
      const mid = emWaveFields(A, kk, w, lambda, t)
      const S = mid.E * mid.B // ∝ |S| 瞬时（教学）
      return {
        time: t,
        values: {
          A,
          lambda,
          period,
          k: kk,
          omega: w,
          c,
          E: mid.E,
          B: mid.B,
          S,
          zMin: Z_MIN,
          zMax: Z_MAX,
          tMax: playPeriod,
          world: 6,
          done: t >= playPeriod - 1e-9 ? 1 : 0,
        },
        trails: { path: eProfile, pathB: bProfile },
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

export const emWaveMeta: DemoMeta = {
  id: 'em-emwave',
  subject: '电磁学',
  category: '电磁波',
  tags: ['电磁波', '横波', '能流'],
  model: 'emWave',
  adapter: 'emWave',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'A', label: '振幅 A', kind: 'number', default: 1, min: 0.3, max: 1.6, step: 0.1, unit: '' },
    { key: 'lambda', label: '波长 λ', kind: 'number', default: 4, min: 2, max: 6, step: 0.5, unit: '' },
    { key: 'period', label: '周期 T', kind: 'number', default: 3, min: 1.5, max: 5, step: 0.5, unit: 's' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'E–B 剖面' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '场',
      chartKey: 'E',
      charts: [
        {
          id: 'eb',
          title: '探针处 E、B、S',
          xLabel: 't (s)',
          leftLabel: '场',
          series: [
            { key: 'E', label: 'E', color: '#38bdf8', unit: '' },
            { key: 'B', label: 'B', color: '#f472b6', unit: '' },
            { key: 'S', label: 'S∝EB', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'c', label: 'c=ω/k', unit: '', tone: 'amber' },
    { key: 'E', label: 'E', unit: '', tone: 'blue' },
    { key: 'S', label: 'S', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '电磁波传播示意',
    summary:
      '平面电磁波沿 +z：E∥ŷ、B∥x̂（示意），同相位、相互垂直。相速 c=ω/k=λ/T；能流 S∝E×B 指向传播方向。',
    concept: [
      '横波：E、B 均垂直于传播方向',
      'E⊥B，同相位（真空平面波）',
      '相速 c=ω/k；坡印廷矢量沿传播方向',
    ],
    objectives: ['观察 E、B 波形同步推进', '验证 c=λ/T', '理解能流方向'],
    formulas: ['E=E_0\\cos(kz-\\omega t)', 'c=\\omega/k=\\lambda/T', '\\vec S\\propto\\vec E\\times\\vec B'],
    insight: '青=E，粉=B；金箭头为传播/能流。调 λ、T 看相速。',
    legend: [
      { color: '#38bdf8', label: 'E' },
      { color: '#f472b6', label: 'B' },
      { color: '#fbbf24', label: '传播 / S' },
    ],
    steps: [
      {
        id: 'speed',
        title: '相速',
        body: '读出 c=λ/T，对照波形推进。',
        formulas: ['c=\\lambda/T'],
        bindings: [
          { labelTex: 'c', valueKey: 'c', unit: '' },
          { labelTex: '\\lambda', valueKey: 'lambda', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'match',
        prompt: '取 λ=4、T=2，使 c=2。',
        hint: 'c=λ/T。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'lambda', target: 4, tol: 0.2 },
            { kind: 'paramNear', key: 'period', target: 2, tol: 0.3 },
            { kind: 'valueNear', key: 'c', target: 2, tol: 0.2 },
          ],
        },
      },
    ],
  },
}

export function registerEmWaveDemo(): void {
  registerDemoBundle({
    meta: emWaveMeta,
    model: createEmWaveModel,
    adapter: createEmWaveAdapter,
  })
}
