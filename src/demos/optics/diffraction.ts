import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createDiffractionAdapter } from './diffractionAdapter'

const N_SCREEN = 140

function sinc2(beta: number): number {
  if (Math.abs(beta) < 1e-8) return 1
  const s = Math.sin(beta) / beta
  return s * s
}

/**
 * 单缝衍射（夫琅禾费，小角）：
 *   β = π a y /(λ L)，  I = I₀ sinc²(β)
 *   暗纹：a y / L = m λ（m=±1,±2,…）→ y_m = m λ L / a
 *   中央亮纹半宽 ≈ λ L / a
 */
export function createDiffractionModel(): PhysicsModel {
  let lambda = 0.5
  let a = 1.0
  let L = 6
  let t = 0

  function period() {
    return 6
  }

  function halfWidth() {
    return (lambda * L) / Math.max(a, 1e-9)
  }

  function yMax() {
    return Math.max(4, 3.5 * halfWidth())
  }

  function intensityAt(y: number) {
    const beta = (Math.PI * a * y) / (lambda * L)
    return sinc2(beta)
  }

  function sampleScreen() {
    const ymax = yMax()
    const I = new Float32Array(N_SCREEN)
    for (let i = 0; i < N_SCREEN; i++) {
      const y = -ymax + (2 * ymax * i) / (N_SCREEN - 1)
      I[i] = intensityAt(y)
    }
    return I
  }

  function probeAt(time: number) {
    const ymax = yMax()
    const u = (time / period()) % 1
    const tri = u < 0.5 ? u * 2 : 2 - u * 2
    const y = -ymax + 2 * ymax * tri
    const beta = (Math.PI * a * y) / (lambda * L)
    const I = sinc2(beta)
    return { y, I, beta }
  }

  return {
    init(params: ParamValues) {
      lambda = Number(params.lambda ?? 0.5)
      a = Number(params.a ?? 1)
      L = Number(params.L ?? 6)
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
      const p = probeAt(t)
      const T = period()
      const y1 = halfWidth() // first minimum
      const ymax = yMax()
      return {
        time: t,
        values: {
          lambda,
          a,
          L,
          y: p.y,
          I: p.I,
          beta: p.beta,
          y1,
          centralWidth: 2 * y1,
          yMax: ymax,
          nScreen: N_SCREEN,
          screenI: sampleScreen(),
          period: T,
          tMax: T,
          worldX: L + 3.2,
          worldY: ymax + 0.8,
          done: t >= T - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.lambda !== undefined) lambda = Number(params.lambda)
      if (params.a !== undefined) a = Number(params.a)
      if (params.L !== undefined) L = Number(params.L)
    },
  }
}

export const diffractionMeta: DemoMeta = {
  id: 'opt-diffraction',
  subject: '光学',
  category: '衍射',
  tags: ['衍射', '单缝', '夫琅禾费'],
  model: 'diffraction',
  adapter: 'diffraction',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'lambda',
      label: '波长 λ',
      kind: 'number',
      default: 0.5,
      min: 0.25,
      max: 1,
      step: 0.05,
      unit: 'u',
    },
    {
      key: 'a',
      label: '缝宽 a',
      kind: 'number',
      default: 1,
      min: 0.4,
      max: 2.5,
      step: 0.05,
      unit: 'u',
    },
    {
      key: 'L',
      label: '屏距 L',
      kind: 'number',
      default: 6,
      min: 3,
      max: 10,
      step: 0.2,
      unit: 'u',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '衍射' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'I',
      charts: [
        {
          id: 'intensity',
          title: '探测点强度',
          xLabel: 't (s)',
          leftLabel: 'I / I₀',
          series: [
            { key: 'I', label: 'I', color: '#38bdf8', unit: '' },
            { key: 'y', label: 'y', color: '#fbbf24', unit: 'u' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'y', label: 'y', unit: 'u', tone: 'amber' },
    { key: 'I', label: 'I/I₀', unit: '', tone: 'blue' },
    { key: 'y1', label: 'y₁', unit: 'u', tone: 'purple' },
    { key: 'centralWidth', label: '中央宽', unit: 'u', tone: 'green' },
    { key: 'a', label: 'a', unit: 'u', tone: 'slate' },
  ],
  docs: {
    title: '单缝衍射',
    summary:
      '夫琅禾费单缝：I=I₀ sinc²(π a y/(λ L))。第一暗纹 y₁=λL/a，中央亮纹全宽≈2λL/a。缝越窄，中央条越宽。',
    concept: [
      '单缝可看成连续次波源的干涉；远场强度呈 sinc² 包络。',
      '暗纹条件：a sinθ = mλ（m=±1,±2,…）。',
      '中央主极大远宽于两侧次极大；a↓ → 中央更宽。',
    ],
    objectives: [
      '辨认中央亮纹与第一暗纹位置',
      '验证 y₁=λL/a',
      '改变 a、λ 观察中央宽度',
    ],
    formulas: [
      'I=I_0\\mathrm{sinc}^2\\!\\left(\\dfrac{\\pi a y}{\\lambda L}\\right)',
      'y_m=m\\dfrac{\\lambda L}{a}\\quad(m=\\pm1,\\pm2,\\ldots)',
      '\\text{中央全宽}\\approx 2\\dfrac{\\lambda L}{a}',
    ],
    insight:
      '顶栏把 I=sinc²(β)、β=πay/(λL) 代入当前 y，应与黄点强度一致；屏旁 m=±1,±2… 标暗纹。拖时间轴核对公式 ↔ 画面。',
    legend: [
      { color: '#4ade80', label: '入射波 / 空间衍射场' },
      { color: '#f87171', label: '惠更斯次波源' },
      { color: '#22c55e', label: '条纹 / I(y)∝sinc²' },
      { color: '#fbbf24', label: '探测点（公式对照）' },
      { color: '#fbbf24', label: '暗纹级次 m' },
    ],
    steps: [
      {
        id: 'sinc',
        title: '强度分布',
        body: '远场单缝衍射强度为 sinc 平方。',
        formulas: ['I=I_0\\mathrm{sinc}^2(\\pi a y/(\\lambda L))'],
        bindings: [
          { labelTex: 'y', valueKey: 'y', unit: 'u' },
          { labelTex: 'I/I_0', valueKey: 'I', unit: '' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'minima',
        title: '暗纹位置',
        body: '第一暗纹在 y₁=λL/a。',
        formulas: ['y_1=\\lambda L / a'],
        bindings: [
          { labelTex: '\\lambda', valueKey: 'lambda', unit: 'u' },
          { labelTex: 'a', valueKey: 'a', unit: 'u' },
          { labelTex: 'L', valueKey: 'L', unit: 'u' },
          { labelTex: 'y_1', valueKey: 'y1', unit: 'u' },
        ],
      },
      {
        id: 'width',
        title: '中央宽度',
        body: '两第一暗纹之间的中央亮纹全宽约为 2λL/a。',
        formulas: ['W\\approx 2\\lambda L / a'],
        bindings: [{ labelTex: 'W', valueKey: 'centralWidth', unit: 'u' }],
      },
    ],
    challenges: [
      {
        id: 'first-min',
        prompt: '取 λ=0.5、a=1、L=6，使第一暗纹 y₁≈3。',
        hint: 'y₁=λL/a=0.5×6/1=3。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'lambda', target: 0.5, tol: 0.05 },
            { kind: 'paramNear', key: 'a', target: 1, tol: 0.1 },
            { kind: 'paramNear', key: 'L', target: 6, tol: 0.3 },
            { kind: 'valueNear', key: 'y1', target: 3, tol: 0.2 },
          ],
        },
      },
      {
        id: 'dark-probe',
        prompt: '把探测点扫到第一暗纹附近（|y|≈y₁），使 I≈0。',
        hint: '播放或拖时间轴，使探测点靠近黄虚线标记。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'I', target: 0, tol: 0.08 },
            { kind: 'valueNear', key: 'y', target: 3, tol: 0.55 },
          ],
        },
      },
    ],
  },
}

export function registerDiffractionDemo(): void {
  registerDemoBundle({
    meta: diffractionMeta,
    model: createDiffractionModel,
    adapter: createDiffractionAdapter,
  })
}
