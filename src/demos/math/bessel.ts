import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createBesselAdapter } from './besselAdapter'

/** J0 级数近似（教学） */
export function besselJ0(x: number): number {
  let s = 1
  let term = 1
  const xx = (x * x) / 4
  for (let k = 1; k <= 12; k++) {
    term *= -xx / (k * k)
    s += term
  }
  return s
}

export function createBesselModel(): PhysicsModel {
  let mode = 1
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      mode = Math.round(Number(p.mode ?? 1))
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const m = Math.min(3, Math.max(1, mode))
      // 圆膜示意：径向 J0(α r) 节点数随 mode
      const alpha = 2.4 * m
      const path: number[][] = []
      for (let i = 0; i <= 80; i++) {
        const r = (2.2 * i) / 80
        path.push([r, besselJ0(alpha * (r / 2.2))])
      }
      const phase = (2 * Math.PI * t) / period
      return {
        time: t,
        values: {
          mode: m,
          alpha,
          phase,
          j0: besselJ0(alpha * 0.5),
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
      if (p.mode !== undefined) mode = Math.round(Number(p.mode))
    },
  }
}

export const besselMeta: DemoMeta = {
  id: 'math-bessel',
  subject: '数理方法',
  category: '特殊函数',
  tags: ['贝塞尔', '圆膜'],
  model: 'bessel',
  adapter: 'bessel',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [{ key: 'mode', label: '径向模态', kind: 'number', default: 1, min: 1, max: 3, step: 1, unit: '' }],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'J₀' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'J0',
      chartKey: 'j0',
      charts: [{ id: 'j', title: '中点 J0', xLabel: 't', leftLabel: 'J0', series: [{ key: 'j0', label: 'J0', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'mode', label: '模态', unit: '', tone: 'slate' },
    { key: 'j0', label: 'J0', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '贝塞尔函数与圆膜模态',
    summary: '圆膜径向位移∝J₀(αr)。更高模态节点更多。',
    concept: ['贝塞尔 J0', '圆膜本征模', '节点圆'],
    objectives: ['切换模态', '观察节点', '对照 J0 曲线'],
    formulas: ['J_0(x)=\\sum(-1)^k (x/2)^{2k}/(k!)^2'],
    insight: '金=径向剖面；播放相位不影响剖面示意。',
    legend: [{ color: '#fbbf24', label: 'J0(αr)' }],
    steps: [{ id: 'm', title: '模态', body: '取 mode=2 看额外节点。', formulas: ['J_0'], bindings: [{ labelTex: 'J_0', valueKey: 'j0', unit: '' }] }],
    challenges: [{ id: 'm3', prompt: '取模态=3。', hint: '调 mode。', check: { kind: 'paramNear', key: 'mode', target: 3, tol: 0.5 } }],
  },
}

export function registerBesselDemo() {
  registerDemoBundle({ meta: besselMeta, model: createBesselModel, adapter: createBesselAdapter })
}
