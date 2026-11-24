import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createGreen1dAdapter } from './green1dAdapter'

/** 一维弦/泊松示意：G(x;x') = (x_< (L−x_>))/L 对 −u''=δ */
export function green1d(x: number, xp: number, L = 1): number {
  const a = Math.min(x, xp)
  const b = Math.max(x, xp)
  return (a * (L - b)) / L
}

export function createGreen1dModel(): PhysicsModel {
  let xp = 0.4
  let t = 0
  const period = 8
  const L = 1

  return {
    init(p: ParamValues) {
      xp = Number(p.xp ?? 0.4)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const xps = 0.15 + (0.7 * t) / period
      const src = t < 1e-9 ? xp : xps
      const path: number[][] = []
      let gMax = 0
      for (let i = 0; i <= 80; i++) {
        const x = (L * i) / 80
        const g = green1d(x, src, L)
        path.push([x, g])
        if (g > gMax) gMax = g
      }
      return {
        time: t,
        values: {
          xp: src,
          xp0: xp,
          gMax,
          L,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.xp !== undefined) xp = Number(p.xp)
    },
  }
}

export const green1dMeta: DemoMeta = {
  id: 'math-green',
  subject: '数理方法',
  category: '格林函数',
  tags: ['格林函数', '点源'],
  model: 'green1d',
  adapter: 'green1d',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [{ key: 'xp', label: '初源位 x′', kind: 'number', default: 0.4, min: 0.1, max: 0.9, step: 0.05, unit: '' }],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'G' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: '峰',
      chartKey: 'gMax',
      charts: [{ id: 'g', title: 'G 峰值', xLabel: 't', leftLabel: 'G', series: [{ key: 'gMax', label: 'Gmax', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'xp', label: 'x′', unit: '', tone: 'slate' },
    { key: 'gMax', label: 'Gmax', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '一维格林函数示意',
    summary: '−u″=δ(x−x′)、两端为零：G 为折线峰，峰值在源点。',
    concept: ['格林函数', '点源响应', '边界条件'],
    objectives: ['播放移动源点', '观察折线峰跟随', '对照峰值'],
    formulas: ['G(x;x\')=x_<(L-x_>)/L'],
    insight: '金折线=G；源点处斜率突变。',
    legend: [{ color: '#fbbf24', label: 'G' }, { color: '#f472b6', label: '源' }],
    steps: [{ id: 'src', title: '源点', body: '播放看峰随 x′ 移动。', formulas: ['G'], bindings: [{ labelTex: "x'", valueKey: 'xp', unit: '' }] }],
    challenges: [{ id: 'right', prompt: '把初源位调到 ≥0.7。', hint: '调 x′。', check: { kind: 'paramNear', key: 'xp', target: 0.8, tol: 0.15 } }],
  },
}

export function registerGreen1dDemo() {
  registerDemoBundle({ meta: green1dMeta, model: createGreen1dModel, adapter: createGreen1dAdapter })
}
