import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createGratingAdapter } from './gratingAdapter'

const N_SCREEN = 160

function sinc2(beta: number): number {
  if (Math.abs(beta) < 1e-8) return 1
  const s = Math.sin(beta) / beta
  return s * s
}

/** 光栅因子 [sin(N δ/2) / sin(δ/2)]²，δ→0 时 → N² */
export function gratingFactor(N: number, delta: number): number {
  const n = Math.max(2, Math.round(N))
  if (Math.abs(delta) < 1e-8) return n * n
  const half = delta / 2
  const s = Math.sin(n * half) / Math.sin(half)
  return s * s
}

/**
 * 多缝光栅（夫琅禾费，小角）：
 *   β = π a y /(λ L)     单缝包络
 *   δ = 2π d y /(λ L)    相邻缝相位差
 *   I = I₀ · sinc²(β) · [sin(Nδ/2)/sin(δ/2)]² / N²
 *   主极大：d y / L = m λ → y_m = m λ L / d
 */
export function gratingIntensity(
  y: number,
  lambda: number,
  a: number,
  d: number,
  L: number,
  N: number,
): { I: number; beta: number; delta: number; envelope: number; factor: number } {
  const lam = Math.max(1e-9, lambda)
  const LL = Math.max(1e-9, L)
  const aa = Math.max(1e-9, a)
  const dd = Math.max(1e-9, d)
  const n = Math.max(2, Math.round(N))
  const beta = (Math.PI * aa * y) / (lam * LL)
  const delta = (2 * Math.PI * dd * y) / (lam * LL)
  const envelope = sinc2(beta)
  const factor = gratingFactor(n, delta)
  const I = envelope * (factor / (n * n))
  return { I, beta, delta, envelope, factor }
}

export function createGratingModel(): PhysicsModel {
  let lambda = 0.5
  let a = 0.35
  let d = 1.2
  let L = 6
  let N = 5
  let t = 0

  function period() {
    return 8
  }

  function y1() {
    // 第一主极大 |m|=1
    return (lambda * L) / Math.max(d, 1e-9)
  }

  function yMax() {
    return Math.max(4.5, 3.2 * y1())
  }

  function intensityAt(y: number) {
    return gratingIntensity(y, lambda, a, d, L, N).I
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
    const g = gratingIntensity(y, lambda, a, d, L, N)
    return { y, ...g }
  }

  return {
    init(params: ParamValues) {
      lambda = Number(params.lambda ?? 0.5)
      a = Number(params.a ?? 0.35)
      d = Number(params.d ?? 1.2)
      L = Number(params.L ?? 6)
      N = Math.max(2, Math.round(Number(params.N ?? 5)))
      // 缝宽不得超过缝距
      a = Math.min(a, d * 0.85)
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
      const ym = y1()
      const ymax = yMax()
      return {
        time: t,
        values: {
          lambda,
          a,
          d,
          L,
          N,
          y: p.y,
          I: p.I,
          beta: p.beta,
          delta: p.delta,
          envelope: p.envelope,
          factor: p.factor,
          y1: ym,
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
      if (params.d !== undefined) d = Number(params.d)
      if (params.L !== undefined) L = Number(params.L)
      if (params.N !== undefined) N = Math.max(2, Math.round(Number(params.N)))
      a = Math.min(a, d * 0.85)
    },
  }
}

export const gratingMeta: DemoMeta = {
  id: 'opt-grating',
  subject: '光学',
  category: '衍射',
  tags: ['光栅', '衍射', '主极大'],
  model: 'grating',
  adapter: 'grating',
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
      key: 'd',
      label: '缝距 d',
      kind: 'number',
      default: 1.2,
      min: 0.6,
      max: 2.5,
      step: 0.05,
      unit: 'u',
    },
    {
      key: 'a',
      label: '缝宽 a',
      kind: 'number',
      default: 0.35,
      min: 0.15,
      max: 1.2,
      step: 0.05,
      unit: 'u',
    },
    {
      key: 'N',
      label: '缝数 N',
      kind: 'number',
      default: 5,
      min: 2,
      max: 12,
      step: 1,
      unit: '',
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
    { id: 'main2d', kind: 'canvas2d', title: '光栅' },
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
            { key: 'envelope', label: '包络', color: '#a78bfa', unit: '' },
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
    { key: 'N', label: 'N', unit: '', tone: 'green' },
    { key: 'd', label: 'd', unit: 'u', tone: 'slate' },
  ],
  docs: {
    title: '光栅衍射',
    summary:
      'N 缝光栅：主极大 d sinθ=mλ（小角 y_m=m λL/d）。强度=单缝包络×光栅因子；N↑ 主峰更锐、次峰更弱。',
    concept: [
      '相邻缝光程差 d sinθ；主极大条件 d sinθ=mλ。',
      '单缝宽度 a 给出 sinc² 包络，压制远离中心的级次。',
      '缝数 N 越大，主极大越窄、对比度越高。',
    ],
    objectives: [
      '对照 y₁=λL/d 与屏上第一主极大',
      '改变 N 观察主峰变锐',
      '改变 d 观察级次间距',
    ],
    formulas: [
      'y_m=m\\dfrac{\\lambda L}{d}',
      'I\\propto\\mathrm{sinc}^2(\\beta)\\,\\left[\\dfrac{\\sin(N\\delta/2)}{\\sin(\\delta/2)}\\right]^2',
      '\\beta=\\dfrac{\\pi a y}{\\lambda L},\\quad\\delta=\\dfrac{2\\pi d y}{\\lambda L}',
    ],
    insight:
      '顶栏代入当前 y 的 β、δ 与 I；屏旁标 m=0,±1,±2… 主极大。拖时间轴看探测点扫过锐峰。',
    legend: [
      { color: '#4ade80', label: '入射平面波' },
      { color: '#f87171', label: '多缝（光栅）' },
      { color: '#22c55e', label: '条纹 / 主极大' },
      { color: '#a78bfa', label: '单缝包络' },
      { color: '#fbbf24', label: '探测点 / 级次 m' },
    ],
    steps: [
      {
        id: 'maxima',
        title: '主极大位置',
        body: '小角下第一主极大 y₁=λL/d。',
        formulas: ['y_1=\\lambda L / d'],
        bindings: [
          { labelTex: '\\lambda', valueKey: 'lambda', unit: 'u' },
          { labelTex: 'd', valueKey: 'd', unit: 'u' },
          { labelTex: 'L', valueKey: 'L', unit: 'u' },
          { labelTex: 'y_1', valueKey: 'y1', unit: 'u' },
        ],
      },
      {
        id: 'factor',
        title: '光栅因子',
        body: '多缝干涉因子使主峰尖锐；N 越大峰越窄。',
        formulas: [
          'I\\propto\\left[\\sin(N\\delta/2)/\\sin(\\delta/2)\\right]^2',
        ],
        bindings: [
          { labelTex: 'N', valueKey: 'N', unit: '' },
          { labelTex: 'I/I_0', valueKey: 'I', unit: '' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'envelope',
        title: '单缝包络',
        body: '缝宽 a 给出 sinc² 包络，调制各主极大高度。',
        formulas: ['\\mathrm{sinc}^2(\\pi a y/(\\lambda L))'],
        bindings: [
          { labelTex: 'a', valueKey: 'a', unit: 'u' },
          { labelTex: '包络', valueKey: 'envelope', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'first-max',
        prompt: '取 λ=0.5、d=1.2、L=6，使 y₁≈2.5。',
        hint: 'y₁=λL/d=0.5×6/1.2=2.5。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'lambda', target: 0.5, tol: 0.05 },
            { kind: 'paramNear', key: 'd', target: 1.2, tol: 0.1 },
            { kind: 'paramNear', key: 'L', target: 6, tol: 0.3 },
            { kind: 'valueNear', key: 'y1', target: 2.5, tol: 0.2 },
          ],
        },
      },
      {
        id: 'bright-probe',
        prompt: '把探测点扫到第一主极大附近（|y|≈y₁），使 I 较高。',
        hint: '播放或拖时间轴，靠近屏旁 m=±1 标记。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'y', target: 2.5, tol: 0.45 },
            { kind: 'valueNear', key: 'I', target: 0.7, tol: 0.45 },
          ],
        },
      },
    ],
  },
}

export function registerGratingDemo(): void {
  registerDemoBundle({
    meta: gratingMeta,
    model: createGratingModel,
    adapter: createGratingAdapter,
  })
}
