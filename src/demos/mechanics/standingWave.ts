import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createStandingWaveAdapter } from './standingWaveAdapter'

/**
 * 驻波（两列等幅反向行波叠加）：
 *   y = A cos(kx−ωt) + A cos(kx+ωt) = 2A cos(kx) cos(ωt)
 * 波腹 x = n λ/2，波节 x = (2n+1) λ/4
 */
export function createStandingWaveModel(): PhysicsModel {
  let A = 0.6
  let lambda = 4
  let period = 2
  let t = 0

  const N_SAMPLES = 140

  function k() {
    return (2 * Math.PI) / Math.max(1e-9, lambda)
  }

  function omega() {
    return (2 * Math.PI) / Math.max(1e-9, period)
  }

  function xMax() {
    // 展示约 1.5 个波长，含多个波节/波腹
    return 1.5 * lambda
  }

  function yAt(x: number, time: number) {
    return 2 * A * Math.cos(k() * x) * Math.cos(omega() * time)
  }

  function vyAt(x: number, time: number) {
    return -2 * A * Math.cos(k() * x) * omega() * Math.sin(omega() * time)
  }

  function profile(time: number): number[][] {
    const xmax = xMax()
    const pts: number[][] = []
    for (let i = 0; i <= N_SAMPLES; i++) {
      const x = (xmax * i) / N_SAMPLES
      pts.push([x, yAt(x, time)])
    }
    return pts
  }

  /** 包络 ±2A |cos(kx)| */
  function envelope(): { upper: number[][]; lower: number[][] } {
    const xmax = xMax()
    const upper: number[][] = []
    const lower: number[][] = []
    for (let i = 0; i <= N_SAMPLES; i++) {
      const x = (xmax * i) / N_SAMPLES
      const amp = 2 * A * Math.abs(Math.cos(k() * x))
      upper.push([x, amp])
      lower.push([x, -amp])
    }
    return { upper, lower }
  }

  return {
    init(params: ParamValues) {
      A = Number(params.A ?? 0.6)
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
      const xNode = lambda / 4
      const xAnti = 0
      const yAnti = yAt(xAnti, t)
      const yNode = yAt(xNode, t)
      const env = envelope()
      return {
        time: t,
        values: {
          A,
          lambda,
          period,
          omega: w,
          k: kk,
          ampMax: 2 * A,
          xNode,
          xAnti,
          yAnti,
          yNode,
          vyAnti: vyAt(xAnti, t),
          xMax: xMax(),
          tMax: period,
          /** 波节应恒为 0 */
          checkNode: yNode,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: {
          path: profile(t),
          envelopeUpper: env.upper,
          envelopeLower: env.lower,
        },
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

export const standingWaveMeta: DemoMeta = {
  id: 'mech-standing-wave',
  subject: '力学',
  category: '波动',
  tags: ['驻波', '叠加', '波节', '波腹'],
  model: 'standingWave',
  adapter: 'standingWave',
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
      label: '分波振幅 A',
      kind: 'number',
      default: 0.6,
      min: 0.2,
      max: 1.2,
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
    { id: 'main2d', kind: 'canvas2d', title: '驻波' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'yAnti',
      charts: [
        {
          id: 'points',
          title: '波腹 / 波节位移',
          xLabel: 't (s)',
          leftLabel: 'y (m)',
          series: [
            { key: 'yAnti', label: '波腹 y(0)', color: '#38bdf8', unit: 'm' },
            { key: 'yNode', label: '波节 y(λ/4)', color: '#f472b6', unit: 'm' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'ampMax', label: '2A', unit: 'm', tone: 'blue' },
    { key: 'yAnti', label: '波腹 y', unit: 'm', tone: 'green' },
    { key: 'yNode', label: '波节 y', unit: 'm', tone: 'purple' },
    { key: 'lambda', label: 'λ', unit: 'm', tone: 'amber' },
    { key: 'period', label: 'T', unit: 's', tone: 'slate' },
  ],
  docs: {
    title: '驻波',
    summary:
      '两列等幅、反向的简谐行波叠加形成驻波。波形不沿 x 传播；波腹振幅最大，波节始终静止。',
    concept: [
      'y = 2A cos(kx) cos(ωt)：空间因子 cos(kx) 与时间因子 cos(ωt) 分离，波形在原地脉动。',
      '波腹：|cos(kx)|=1，振幅达 2A；波节：cos(kx)=0，位移恒为 0。相邻波腹/波节间距为 λ/4。',
      '虚线包络标出各点可能达到的最大位移；可与「横波传播」对照行波与驻波差异。',
    ],
    objectives: [
      '指出波节与波腹位置',
      '验证波节位移恒为 0',
      '理解驻波由两列行波干涉形成',
    ],
    formulas: [
      'y=2A\\cos(kx)\\cos(\\omega t)',
      '\\text{波腹: } x=n\\dfrac{\\lambda}{2}',
      '\\text{波节: } x=(2n+1)\\dfrac{\\lambda}{4}',
    ],
    insight:
      '青线为瞬时波形，粉虚线为包络。金点在波腹振动，品红点在波节应几乎不动。勾选循环可连续观察脉动。',
    legend: [
      { color: '#38bdf8', label: '驻波波形' },
      { id: 'compare', color: '#f472b6', label: '包络 ±2A|cos kx|' },
      { color: '#fbbf24', label: '波腹示踪' },
      { color: '#f472b6', label: '波节示踪' },
    ],
    steps: [
      {
        id: 'superpose',
        title: '两列行波叠加',
        body: '向右与向左的等幅简谐波相加，得到驻波形式。',
        formulas: [
          'y_\\rightarrow=A\\cos(kx-\\omega t)',
          'y_\\leftarrow=A\\cos(kx+\\omega t)',
          'y=y_\\rightarrow+y_\\leftarrow=2A\\cos(kx)\\cos(\\omega t)',
        ],
        bindings: [
          { labelTex: 'A', valueKey: 'A', unit: 'm' },
          { labelTex: '\\lambda', valueKey: 'lambda', unit: 'm' },
          { labelTex: 'T', valueKey: 'period', unit: 's' },
        ],
      },
      {
        id: 'nodes',
        title: '波节与波腹',
        body: '波腹振幅 2A；波节永不离开平衡位置。',
        formulas: [
          'x_{\\mathrm{腹}}=n\\lambda/2',
          'x_{\\mathrm{节}}=(2n+1)\\lambda/4',
        ],
        bindings: [
          { labelTex: '2A', valueKey: 'ampMax', unit: 'm' },
          { labelTex: 'y_{\\mathrm{腹}}', valueKey: 'yAnti', unit: 'm' },
          { labelTex: 'y_{\\mathrm{节}}', valueKey: 'yNode', unit: 'm' },
        ],
        highlightOn: 'scrub',
      },
    ],
    challenges: [
      {
        id: 'node-still',
        prompt: '拖动时间轴任意位置，确认波节位移 |yNode|≈0。',
        hint: '波节由 cos(kx)=0 决定，与时间无关。',
        check: { kind: 'valueNear', key: 'checkNode', target: 0, tol: 0.05 },
      },
      {
        id: 'amp-2A',
        prompt: '令分波振幅 A=0.5，使最大振幅 2A≈1.0 m。',
        hint: '读数 2A 应为 1。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'A', target: 0.5, tol: 0.05 },
            { kind: 'valueNear', key: 'ampMax', target: 1, tol: 0.08 },
          ],
        },
      },
    ],
  },
}

export function registerStandingWaveDemo(): void {
  registerDemoBundle({
    meta: standingWaveMeta,
    model: createStandingWaveModel,
    adapter: createStandingWaveAdapter,
  })
}
