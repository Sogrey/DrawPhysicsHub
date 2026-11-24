import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createQmDoubleSlitAdapter } from './doubleSlitAdapter'

/** 双缝强度 I∝ cos²(π d sinθ / λ)，屏上用小角 y≈L θ */
export function doubleSlitIntensity(y: number, d: number, lambda: number, L: number): number {
  const th = Math.atan2(y, Math.max(0.5, L))
  const arg = (Math.PI * Math.max(0.05, d) * Math.sin(th)) / Math.max(0.05, lambda)
  const c = Math.cos(arg)
  return c * c
}

const NS = 160

export function createQmDoubleSlitModel(): PhysicsModel {
  let d = 1.2
  let lambda = 0.35
  let L = 4
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      d = Number(params.d ?? 1.2)
      lambda = Number(params.lambda ?? 0.35)
      L = Number(params.L ?? 4)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const yMax = 3
      const dens = new Float32Array(NS)
      const ys = new Float32Array(NS)
      let iMax = 0.01
      for (let i = 0; i < NS; i++) {
        const y = -yMax + (2 * yMax * i) / (NS - 1)
        ys[i] = y
        const I = doubleSlitIntensity(y, d, lambda, L)
        dens[i] = I
        iMax = Math.max(iMax, I)
      }
      const fringe = (lambda * L) / Math.max(0.05, d) // 小角条纹间距 Δy≈λL/d
      const reveal = Math.min(1, t / period)
      return {
        time: t,
        values: {
          d,
          lambda,
          L,
          fringe,
          iMax,
          yMax,
          nSamp: NS,
          dens,
          ys,
          reveal,
          period,
          tMax: period,
          world: 5,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.d !== undefined) d = Number(params.d)
      if (params.lambda !== undefined) lambda = Number(params.lambda)
      if (params.L !== undefined) L = Number(params.L)
    },
  }
}

export const qmDoubleSlitMeta: DemoMeta = {
  id: 'qm-double-slit',
  subject: '量子力学',
  category: '近代实验',
  tags: ['双缝', '干涉', '概率'],
  model: 'qmDoubleSlit',
  adapter: 'qmDoubleSlit',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'd', label: '缝距 d', kind: 'number', default: 1.2, min: 0.6, max: 2.5, step: 0.1, unit: '' },
    { key: 'lambda', label: '波长 λ', kind: 'number', default: 0.35, min: 0.15, max: 0.7, step: 0.05, unit: '' },
    { key: 'L', label: '屏距 L', kind: 'number', default: 4, min: 2.5, max: 6, step: 0.25, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '干涉' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '条纹',
      chartKey: 'fringe',
      charts: [
        {
          id: 'fringe',
          title: '条纹间距',
          xLabel: 't (s)',
          leftLabel: 'Δy',
          series: [{ key: 'fringe', label: 'Δy≈λL/d', color: '#38bdf8', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'd', label: 'd', unit: '', tone: 'slate' },
    { key: 'lambda', label: 'λ', unit: '', tone: 'blue' },
    { key: 'fringe', label: 'Δy', unit: '', tone: 'amber' },
    { key: 'L', label: 'L', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '电子双缝干涉示意',
    summary: '概率密度在屏上呈 cos² 干涉条纹；Δy≈λL/d。强调单粒子积累仍得干涉图样（示意）。',
    concept: [
      '物质波同样可干涉',
      '条纹间距随 λ、L 增大、随 d 减小而变大',
      '关闭一缝则干涉消失（对比光学双缝）',
    ],
    objectives: ['验证 Δy≈λL/d', '观察 d 增大条纹变密', '理解概率诠释'],
    formulas: ['I\\propto\\cos^2(\\pi d\\sin\\theta/\\lambda)', '\\Delta y\\approx\\lambda L/d'],
    insight: '播放可见两缝圆形辅助波前 + 空间干涉场；屏上条纹逐渐曝光。Δy≈λL/d。',
    legend: [
      { color: '#38bdf8', label: '强度' },
      { color: '#fbbf24', label: '缝' },
      { color: '#a78bfa', label: '屏' },
    ],
    steps: [
      {
        id: 'spacing',
        title: '条纹间距',
        body: '调节 λ、d、L，读 Δy。',
        formulas: ['\\Delta y\\approx\\lambda L/d'],
        bindings: [
          { labelTex: '\\lambda', valueKey: 'lambda', unit: '' },
          { labelTex: 'd', valueKey: 'd', unit: '' },
          { labelTex: '\\Delta y', valueKey: 'fringe', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'fringe-check',
        prompt: '取 λ=0.35、d=1.2、L=4，使 Δy≈1.17。',
        hint: 'λL/d。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'lambda', target: 0.35, tol: 0.05 },
            { kind: 'valueNear', key: 'fringe', target: (0.35 * 4) / 1.2, tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerQmDoubleSlitDemo(): void {
  registerDemoBundle({
    meta: qmDoubleSlitMeta,
    model: createQmDoubleSlitModel,
    adapter: createQmDoubleSlitAdapter,
  })
}
