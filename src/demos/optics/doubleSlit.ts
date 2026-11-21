import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createDoubleSlitAdapter } from './doubleSlitAdapter'

const N_SCREEN = 120

/**
 * 杨氏双缝干涉（远场小角近似）：
 *   δ ≈ d · y / L，  I = I₀ cos²(π d y /(λ L))
 *   条纹间距 Δy = λ L / d
 * 探测点沿屏扫过，读出当地强度。
 */
export function createDoubleSlitModel(): PhysicsModel {
  let lambda = 0.5 // 教学单位：与几何同量纲
  let d = 1.2
  let L = 6
  let t = 0

  function period() {
    return 6
  }

  function yMax() {
    return Math.max(3.5, (3 * lambda * L) / Math.max(d, 1e-6))
  }

  function intensityAt(y: number) {
    const arg = (Math.PI * d * y) / (lambda * L)
    return Math.cos(arg) ** 2
  }

  function pathDiff(y: number) {
    return (d * y) / L
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
    // 半周期扫上半，整周期来回：三角波
    const u = (time / period()) % 1
    const tri = u < 0.5 ? u * 2 : 2 - u * 2 // 0→1→0
    const y = -ymax + 2 * ymax * tri
    const I = intensityAt(y)
    const delta = pathDiff(y)
    const phi = (2 * Math.PI * delta) / lambda
    return { y, I, delta, phi }
  }

  return {
    init(params: ParamValues) {
      lambda = Number(params.lambda ?? 0.5)
      d = Number(params.d ?? 1.2)
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
      const dy = (lambda * L) / Math.max(d, 1e-9)
      const ymax = yMax()
      return {
        time: t,
        values: {
          lambda,
          d,
          L,
          y: p.y,
          I: p.I,
          delta: p.delta,
          phi: p.phi,
          phiDeg: (p.phi * 180) / Math.PI,
          dy,
          yMax: ymax,
          nScreen: N_SCREEN,
          screenI: sampleScreen(),
          period: T,
          tMax: T,
          worldX: L + 2.8,
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
      if (params.d !== undefined) d = Number(params.d)
      if (params.L !== undefined) L = Number(params.L)
    },
  }
}

export const doubleSlitMeta: DemoMeta = {
  id: 'opt-double-slit',
  subject: '光学',
  category: '干涉',
  tags: ['干涉', '杨氏', '双缝'],
  model: 'doubleSlit',
  adapter: 'doubleSlit',
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
      min: 0.5,
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
    { id: 'main2d', kind: 'canvas2d', title: '干涉' },
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
    { key: 'delta', label: 'δ', unit: 'u', tone: 'purple' },
    { key: 'dy', label: 'Δy', unit: 'u', tone: 'green' },
    { key: 'phiDeg', label: 'φ', unit: '°', tone: 'slate' },
  ],
  docs: {
    title: '双缝干涉条纹',
    summary:
      '杨氏双缝：两缝相干叠加。屏上强度 I=I₀ cos²(π d y/(λ L))；条纹间距 Δy=λL/d。探测点沿屏扫过读出当地 I。',
    concept: [
      '光程差 δ≈d·y/L（小角），相位差 φ=2πδ/λ。',
      '亮纹：δ=mλ；暗纹：δ=(m+1/2)λ。',
      'Δy=λL/d：λ↑ 或 d↓ 或 L↑ → 条纹变疏。',
    ],
    objectives: [
      '从屏上亮暗读出干涉条纹',
      '对照 Δy 与参数关系',
      '在探测点验证 I=cos²(π d y/(λ L))',
    ],
    formulas: [
      'I=I_0\\cos^2\\!\\left(\\dfrac{\\pi d y}{\\lambda L}\\right)',
      '\\Delta y=\\dfrac{\\lambda L}{d}',
      '\\delta\\approx\\dfrac{d y}{L}',
    ],
    insight:
      '播放时可见：两缝相干光场在空间形成明暗带（相长/相消），屏上截取即干涉条纹。探测点标注光程差 δ 与相位差 φ。',
    legend: [
      { color: '#38bdf8', label: '空间干涉光场 / 波面' },
      { color: '#f87171', label: '双缝 A₁ A₂' },
      { color: '#60a5fa', label: '屏条纹 / I(y)' },
      { color: '#fbbf24', label: '探测点（δ、相长/相消）' },
    ],
    steps: [
      {
        id: 'path',
        title: '光程差',
        body: '到屏上点 y 的两束光程差近似为 d·y/L。',
        formulas: ['\\delta\\approx d y / L', '\\varphi=2\\pi\\delta/\\lambda'],
        bindings: [
          { labelTex: 'y', valueKey: 'y', unit: 'u' },
          { labelTex: '\\delta', valueKey: 'delta', unit: 'u' },
        ],
      },
      {
        id: 'intensity',
        title: '强度',
        body: '相干叠加给出余弦平方条纹。',
        formulas: ['I=I_0\\cos^2(\\pi d y/(\\lambda L))'],
        bindings: [
          { labelTex: 'I/I_0', valueKey: 'I', unit: '' },
          { labelTex: '\\varphi', valueKey: 'phiDeg', unit: '°' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'spacing',
        title: '条纹间距',
        body: '相邻亮纹间距 Δy=λL/d。',
        formulas: ['\\Delta y=\\lambda L / d'],
        bindings: [
          { labelTex: '\\lambda', valueKey: 'lambda', unit: 'u' },
          { labelTex: 'd', valueKey: 'd', unit: 'u' },
          { labelTex: 'L', valueKey: 'L', unit: 'u' },
          { labelTex: '\\Delta y', valueKey: 'dy', unit: 'u' },
        ],
      },
    ],
    challenges: [
      {
        id: 'spacing',
        prompt: '取 λ=0.5、d=1.2、L=6，使 Δy≈2.5。',
        hint: 'Δy=λL/d=0.5×6/1.2=2.5。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'lambda', target: 0.5, tol: 0.05 },
            { kind: 'paramNear', key: 'd', target: 1.2, tol: 0.1 },
            { kind: 'paramNear', key: 'L', target: 6, tol: 0.3 },
            { kind: 'valueNear', key: 'dy', target: 2.5, tol: 0.15 },
          ],
        },
      },
      {
        id: 'bright-center',
        prompt: '把探测点扫到屏中心附近（|y|较小），使 I≈1（中央亮纹）。',
        hint: '中央 y=0 处两束同相，强度最大。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'y', target: 0, tol: 0.35 },
            { kind: 'valueNear', key: 'I', target: 1, tol: 0.12 },
          ],
        },
      },
    ],
  },
}

export function registerDoubleSlitDemo(): void {
  registerDemoBundle({
    meta: doubleSlitMeta,
    model: createDoubleSlitModel,
    adapter: createDoubleSlitAdapter,
  })
}
