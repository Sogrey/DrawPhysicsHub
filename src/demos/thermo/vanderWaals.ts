import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createVanderWaalsAdapter } from './vanderWaalsAdapter'

/** (P+a/V²)(V−b)=RT → P = RT/(V−b) − a/V² */
export function vdwPressure(T: number, V: number, a: number, b: number, R = 1): number {
  const vv = Math.max(b + 1e-6, V)
  return (R * T) / (vv - b) - a / (vv * vv)
}

export function createVanderWaalsModel(): PhysicsModel {
  let T = 1.2
  let a = 1.4
  let b = 0.25
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      T = Number(p.T ?? 1.2)
      a = Number(p.a ?? 1.4)
      b = Number(p.b ?? 0.25)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const path: number[][] = []
      let pMin = Infinity
      let vAt = 1
      for (let i = 0; i <= 80; i++) {
        const V = b + 0.15 + (3.5 * i) / 80
        const P = vdwPressure(T, V, a, b)
        path.push([V, P])
        if (P < pMin) {
          pMin = P
          vAt = V
        }
      }
      const Vmark = b + 0.15 + (3.5 * t) / period
      const Pmark = vdwPressure(T, Vmark, a, b)
      return {
        time: t,
        values: {
          T,
          a,
          b,
          Vmark,
          Pmark,
          pMin,
          vAt,
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
      if (p.T !== undefined) T = Number(p.T)
      if (p.a !== undefined) a = Number(p.a)
      if (p.b !== undefined) b = Number(p.b)
    },
  }
}

export const vanderWaalsMeta: DemoMeta = {
  id: 'thermo-vanderwaals',
  subject: '热学',
  category: '理想气体定律',
  tags: ['实际气体', '等温线'],
  model: 'vanderWaals',
  adapter: 'vanderWaals',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'T', label: '温度 T', kind: 'number', default: 1.2, min: 0.7, max: 2, step: 0.05, unit: '' },
    { key: 'a', label: 'a', kind: 'number', default: 1.4, min: 0.2, max: 2.5, step: 0.1, unit: '' },
    { key: 'b', label: 'b', kind: 'number', default: 0.25, min: 0.1, max: 0.5, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '等温线' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'P',
      chartKey: 'Pmark',
      charts: [{ id: 'p', title: '沿等温线扫描', xLabel: 't', leftLabel: 'P', series: [{ key: 'Pmark', label: 'P', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'T', label: 'T', unit: '', tone: 'slate' },
    { key: 'Pmark', label: 'P', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '范德瓦尔斯方程示意',
    summary: 'P=RT/(V−b)−a/V²。低温可出现回环；高温接近理想气体。',
    concept: ['实际气体', '排斥体积 b', '吸引修正 a'],
    objectives: ['降 T 看回环', '改 a、b', '播放沿等温线扫 V'],
    formulas: ['\\bigl(P+a/V^2\\bigr)(V-b)=RT'],
    insight: '金曲线=等温线；点=当前 (V,P)。',
    legend: [{ color: '#fbbf24', label: '等温线' }],
    steps: [{ id: 'loop', title: '回环', body: '降低 T 观察范德瓦尔斯回环。', formulas: ['T'], bindings: [{ labelTex: 'T', valueKey: 'T', unit: '' }] }],
    challenges: [{ id: 'cold', prompt: '取 T≤0.9。', hint: '降温。', check: { kind: 'paramNear', key: 'T', target: 0.8, tol: 0.15 } }],
  },
}

export function registerVanderWaalsDemo() {
  registerDemoBundle({ meta: vanderWaalsMeta, model: createVanderWaalsModel, adapter: createVanderWaalsAdapter })
}
