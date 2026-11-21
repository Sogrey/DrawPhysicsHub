import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createThinFilmAdapter } from './thinFilmAdapter'

/**
 * 薄膜干涉（正入射，空气中皂膜/油膜类：上表面半波损失）：
 *   光程差 δ = 2 n d
 *   亮纹（反射加强）：2 n d = (m+1/2) λ  →  δ/λ = m+1/2
 *   暗纹（反射相消）：2 n d = m λ        →  δ/λ = m
 *   反射强度（两束近似等幅）：I ∝ cos²(π δ/λ + π/2) = sin²(π δ/λ)
 *   因半波损失等效额外 π，故 I = sin²(π · 2nd/λ)
 *
 * 播放：厚度 d 从薄扫到厚，观察亮暗交替与色带示意。
 */
export function thinFilmState(
  n: number,
  d: number,
  lambda: number,
): {
  delta: number
  order: number
  I: number
  bright: boolean
  dark: boolean
  condition: string
} {
  const nn = Math.max(1, n)
  const dd = Math.max(1e-6, d)
  const lam = Math.max(1e-6, lambda)
  const delta = 2 * nn * dd
  const ratio = delta / lam
  // 半波损失 → 反射：I = sin²(π · 2nd/λ)
  const I = Math.sin(Math.PI * ratio) ** 2
  const nearestHalf = Math.round(ratio * 2) / 2
  const bright = Math.abs(ratio - (Math.floor(ratio) + 0.5)) < 0.08 || I > 0.85
  const dark = Math.abs(ratio - Math.round(ratio)) < 0.08 || I < 0.12
  const mBright = Math.floor(ratio)
  const condition = dark
    ? `暗：2nd = mλ  (m≈${Math.round(ratio)})`
    : bright
      ? `亮：2nd = (m+½)λ  (m≈${mBright})`
      : `过渡 · δ/λ=${ratio.toFixed(2)}`
  return { delta, order: nearestHalf, I, bright, dark, condition }
}

export function createThinFilmModel(): PhysicsModel {
  let n = 1.33
  let lambda = 0.55 // 教学单位，与 d 同量纲
  let dMax = 1.2
  let t = 0
  const period = 8

  function dAt(time: number) {
    // 从近零扫到 dMax
    return (dMax * time) / period
  }

  return {
    init(params: ParamValues) {
      n = Number(params.n ?? 1.33)
      lambda = Number(params.lambda ?? 0.55)
      dMax = Number(params.dMax ?? 1.2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const d = Math.max(0.02, dAt(t))
      const s = thinFilmState(n, d, lambda)
      // 光谱示意：若干采样波长的反射强度
      const bands = 7
      const spectrum = new Float32Array(bands)
      for (let i = 0; i < bands; i++) {
        const lam = 0.4 + (0.3 * i) / (bands - 1) // 0.4–0.7
        spectrum[i] = thinFilmState(n, d, lam).I
      }
      return {
        time: t,
        values: {
          n,
          lambda,
          dMax,
          d,
          delta: s.delta,
          order: s.order,
          I: s.I,
          bright: s.bright ? 1 : 0,
          dark: s.dark ? 1 : 0,
          ratio: s.delta / lambda,
          spectrum,
          nBands: bands,
          period,
          tMax: period,
          world: 6,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.n !== undefined) n = Number(params.n)
      if (params.lambda !== undefined) lambda = Number(params.lambda)
      if (params.dMax !== undefined) dMax = Number(params.dMax)
    },
  }
}

export const thinFilmMeta: DemoMeta = {
  id: 'opt-thin-film',
  subject: '光学',
  category: '干涉',
  tags: ['薄膜', '干涉', '光程差', '半波损失'],
  model: 'thinFilm',
  adapter: 'thinFilm',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'n',
      label: '膜折射率 n',
      kind: 'number',
      default: 1.33,
      min: 1.1,
      max: 1.8,
      step: 0.01,
      unit: '',
    },
    {
      key: 'lambda',
      label: '波长 λ',
      kind: 'number',
      default: 0.55,
      min: 0.4,
      max: 0.7,
      step: 0.01,
      unit: 'u',
    },
    {
      key: 'dMax',
      label: '最大厚度',
      kind: 'number',
      default: 1.2,
      min: 0.4,
      max: 2,
      step: 0.05,
      unit: 'u',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '薄膜' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'I',
      charts: [
        {
          id: 'intensity',
          title: '反射强度',
          xLabel: 't (s)',
          leftLabel: 'I',
          series: [
            { key: 'I', label: 'I', color: '#38bdf8', unit: '' },
            { key: 'd', label: 'd', color: '#fbbf24', unit: 'u' },
            { key: 'ratio', label: 'δ/λ', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'd', label: 'd', unit: 'u', tone: 'amber' },
    { key: 'delta', label: 'δ', unit: 'u', tone: 'purple' },
    { key: 'I', label: 'I', unit: '', tone: 'blue' },
    { key: 'ratio', label: 'δ/λ', unit: '', tone: 'green' },
    { key: 'n', label: 'n', unit: '', tone: 'slate' },
  ],
  docs: {
    title: '薄膜干涉',
    summary:
      '空气中薄膜上表面反射有半波损失：反射亮纹 2nd=(m+½)λ，暗纹 2nd=mλ。播放加厚膜层，观察亮暗交替。',
    concept: [
      '两束反射光：上表面（半波损失）与下表面（经膜内光程 2nd）。',
      '有效光程差 δ=2nd；半波损失使亮/暗条件互换（相对无损失情形）。',
      '厚度连续变化时出现等厚条纹；白光下不同 λ 亮暗位置不同→彩色。',
    ],
    objectives: [
      '对照 δ=2nd 与屏上/色带亮暗',
      '在暗纹附近验证 2nd≈mλ',
      '改变 n、λ 看条纹疏密',
    ],
    formulas: [
      '\\delta=2nd',
      '\\text{亮（反射）}\\colon 2nd=(m+\\tfrac12)\\lambda',
      '\\text{暗（反射）}\\colon 2nd=m\\lambda',
      'I\\propto\\sin^2(\\pi\\cdot 2nd/\\lambda)',
    ],
    insight:
      '左侧入射→膜上/下表面反射；右侧色带随厚度亮暗变化。顶栏代入 2nd 与 λ，标明当前亮/暗条件。',
    legend: [
      { color: '#4ade80', label: '入射' },
      { color: '#fbbf24', label: '上表面反射（半波损失）' },
      { color: '#38bdf8', label: '下表面反射' },
      { color: '#a78bfa', label: '薄膜' },
      { color: '#22d3ee', label: '反射强度 / 色带' },
    ],
    steps: [
      {
        id: 'path',
        title: '光程差',
        body: '下表面反射多走 2nd；上表面有半波损失。',
        formulas: ['\\delta=2nd'],
        bindings: [
          { labelTex: 'n', valueKey: 'n', unit: '' },
          { labelTex: 'd', valueKey: 'd', unit: 'u' },
          { labelTex: '\\delta', valueKey: 'delta', unit: 'u' },
        ],
      },
      {
        id: 'condition',
        title: '亮暗条件',
        body: '反射：2nd=mλ 暗，2nd=(m+½)λ 亮。',
        formulas: ['I\\propto\\sin^2(\\pi\\cdot 2nd/\\lambda)'],
        bindings: [
          { labelTex: '\\delta/\\lambda', valueKey: 'ratio', unit: '' },
          { labelTex: 'I', valueKey: 'I', unit: '' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'spectrum',
        title: '色带',
        body: '同一厚度下不同波长 I 不同，故白光呈彩色条纹。',
        formulas: ['2nd=(m+1/2)\\lambda'],
        bindings: [{ labelTex: '\\lambda', valueKey: 'lambda', unit: 'u' }],
      },
    ],
    challenges: [
      {
        id: 'dark',
        prompt: '拖到反射接近相消（I≈0，dark≈1）。',
        hint: '2nd≈mλ 时暗；看顶栏条件。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'I', target: 0, tol: 0.15 },
            { kind: 'valueNear', key: 'dark', target: 1, tol: 0.2 },
          ],
        },
      },
      {
        id: 'bright',
        prompt: '拖到反射接近加强（I≈1，bright≈1）。',
        hint: '2nd≈(m+½)λ 时亮。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'I', target: 1, tol: 0.2 },
            { kind: 'valueNear', key: 'bright', target: 1, tol: 0.2 },
          ],
        },
      },
    ],
  },
}

export function registerThinFilmDemo(): void {
  registerDemoBundle({
    meta: thinFilmMeta,
    model: createThinFilmModel,
    adapter: createThinFilmAdapter,
  })
}
