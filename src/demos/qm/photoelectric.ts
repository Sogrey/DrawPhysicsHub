import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createPhotoelectricAdapter } from './photoelectricAdapter'

/** 教学 h=1：Kmax = max(0, f - W) */
export function kmaxPhoto(f: number, W: number, h = 1): number {
  return Math.max(0, h * Math.max(0, f) - Math.max(0, W))
}

export function cutoffFreq(W: number, h = 1): number {
  return Math.max(0, W) / Math.max(1e-9, h)
}

export function createPhotoelectricModel(): PhysicsModel {
  let f = 2.2
  let W = 1.5
  let I = 0.6
  let t = 0
  const period = 8
  const h = 1

  return {
    init(params: ParamValues) {
      f = Number(params.f ?? 2.2)
      W = Number(params.W ?? 1.5)
      I = Number(params.I ?? 0.6)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const Kmax = kmaxPhoto(f, W, h)
      const f0 = cutoffFreq(W, h)
      const above = f > f0 ? 1 : 0
      // electron burst positions for animation
      const nElec = above ? Math.min(24, Math.max(1, Math.round(I * 18))) : 0
      const ex = new Float32Array(nElec)
      const ey = new Float32Array(nElec)
      const progress = t / period
      for (let i = 0; i < nElec; i++) {
        const seed = (i * 17 + 3) % 100
        const launch = (seed / 100) * 0.85
        const u = Math.max(0, progress - launch)
        ex[i] = -1.2 + u * (2.8 + (seed % 7) * 0.08) * (0.6 + Kmax * 0.25)
        ey[i] = ((seed % 11) - 5) * 0.12 + Math.sin(u * 6 + i) * 0.05
      }
      const nCurve = 60
      const curveF = new Float32Array(nCurve)
      const curveK = new Float32Array(nCurve)
      const fMax = Math.max(4, f * 1.2, f0 * 1.5)
      for (let i = 0; i < nCurve; i++) {
        const ff = (fMax * i) / (nCurve - 1)
        curveF[i] = ff
        curveK[i] = kmaxPhoto(ff, W, h)
      }
      return {
        time: t,
        values: {
          f,
          W,
          I,
          h,
          Kmax,
          f0,
          above,
          nElec,
          ex,
          ey,
          curveF,
          curveK,
          nCurve,
          fMax,
          period,
          tMax: period,
          world: 4,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.f !== undefined) f = Number(params.f)
      if (params.W !== undefined) W = Number(params.W)
      if (params.I !== undefined) I = Number(params.I)
    },
  }
}

export const photoelectricMeta: DemoMeta = {
  id: 'qm-photoelectric',
  subject: '量子力学',
  category: '近代实验',
  tags: ['光电效应', '截止频率', '爱因斯坦'],
  model: 'photoelectric',
  adapter: 'photoelectric',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    {
      key: 'f',
      label: '频率 f',
      kind: 'number',
      default: 2.2,
      min: 0.5,
      max: 4,
      step: 0.1,
      unit: '',
    },
    {
      key: 'W',
      label: '逸出功 W',
      kind: 'number',
      default: 1.5,
      min: 0.5,
      max: 3,
      step: 0.1,
      unit: '',
    },
    {
      key: 'I',
      label: '光强 I',
      kind: 'number',
      default: 0.6,
      min: 0.1,
      max: 1,
      step: 0.05,
      unit: '',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '装置' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'Kmax',
      chartKey: 'Kmax',
      charts: [
        {
          id: 'kmax',
          title: '最大动能',
          xLabel: 't (s)',
          leftLabel: 'Kmax',
          series: [{ key: 'Kmax', label: 'Kmax', color: '#fbbf24', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'f', label: 'f', unit: '', tone: 'blue' },
    { key: 'W', label: 'W', unit: '', tone: 'slate' },
    { key: 'f0', label: 'f₀', unit: '', tone: 'purple' },
    { key: 'Kmax', label: 'Kmax', unit: '', tone: 'amber' },
    { key: 'above', label: '发射', unit: '', tone: 'green' },
  ],
  docs: {
    title: '光电效应装置示意',
    summary:
      '爱因斯坦关系 K_max=hf−W。频率低于截止 f₀=W/h 时无光电子；光强只改变电子数目，不改变 K_max。',
    concept: [
      '光电子最大动能随频率线性增加，与光强无关',
      '存在截止频率 f₀=W/h',
      '光强影响单位时间逸出电子数（电流），不改变 K_max',
    ],
    objectives: [
      '找到截止频率并验证 f₀=W/h',
      '确认 I 不改变 Kmax',
      '观察 f>f₀ 时电子射出动画',
    ],
    formulas: [
      'K_{\\max}=hf-W',
      'f_0=W/h',
      'h=1\\ (\\text{教学单位})',
    ],
    insight: '教学 h=1。右侧能量账本对比 hf / W / Kmax；只有 hf>W 才有光电子。左下 K–f 线，粉点=工作点。',
    legend: [
      { color: '#38bdf8', label: '入射光' },
      { color: '#fbbf24', label: '光电子' },
      { color: '#a78bfa', label: 'K–f 线' },
      { color: '#f472b6', label: '工作点' },
    ],
    steps: [
      {
        id: 'cutoff',
        title: '截止频率',
        body: '降低 f 直至 Kmax→0，读 f₀。',
        formulas: ['f_0=W/h'],
        bindings: [
          { labelTex: 'W', valueKey: 'W', unit: '' },
          { labelTex: 'f_0', valueKey: 'f0', unit: '' },
          { labelTex: 'K_{\\max}', valueKey: 'Kmax', unit: '' },
        ],
      },
      {
        id: 'intensity',
        title: '光强',
        body: '改变 I，Kmax 不变，电子数变化。',
        formulas: ['K_{\\max}\\neq K(I)'],
        bindings: [
          { labelTex: 'I', valueKey: 'I', unit: '' },
          { labelTex: 'K_{\\max}', valueKey: 'Kmax', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'kmax',
        prompt: '取 f=2.2、W=1.5，使 Kmax≈0.7。',
        hint: 'Kmax=f−W（h=1）。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'f', target: 2.2, tol: 0.15 },
            { kind: 'paramNear', key: 'W', target: 1.5, tol: 0.15 },
            { kind: 'valueNear', key: 'Kmax', target: 0.7, tol: 0.08 },
          ],
        },
      },
    ],
  },
}

export function registerPhotoelectricDemo(): void {
  registerDemoBundle({
    meta: photoelectricMeta,
    model: createPhotoelectricModel,
    adapter: createPhotoelectricAdapter,
  })
}
