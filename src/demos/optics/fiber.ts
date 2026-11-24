import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createFiberAdapter } from './fiberAdapter'

/** 临界角 sin θc = n2/n1（从芯到包层） */
export function criticalAngleDeg(n1: number, n2: number): number {
  const s = Math.min(1, Math.max(0, n2 / Math.max(1e-9, n1)))
  return (Math.asin(s) * 180) / Math.PI
}

export function createFiberModel(): PhysicsModel {
  let n1 = 1.48
  let n2 = 1.4
  let theta = 20
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      n1 = Number(p.n1 ?? 1.48)
      n2 = Number(p.n2 ?? 1.4)
      theta = Number(p.theta ?? 20)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const tc = criticalAngleDeg(n1, n2)
      // θ 为相对轴线的入射余角；界面角 = 90−θ
      const iface = 90 - theta
      const guided = iface > tc ? 1 : 0
      const u = t / period
      const x = -2 + 4 * u
      // 锯齿路径幅度
      const amp = guided ? 0.55 : Math.min(1.2, 0.55 + 0.8 * (tc - iface) * 0.05)
      const y = amp * Math.sin(Math.PI * 3 * u)
      return {
        time: t,
        values: {
          n1,
          n2,
          theta,
          tc,
          iface,
          guided,
          x,
          y,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.n1 !== undefined) n1 = Number(p.n1)
      if (p.n2 !== undefined) n2 = Number(p.n2)
      if (p.theta !== undefined) theta = Number(p.theta)
    },
  }
}

export const fiberMeta: DemoMeta = {
  id: 'opt-fiber',
  subject: '光学',
  category: '应用光学',
  tags: ['光纤', '全反射'],
  model: 'fiber',
  adapter: 'fiber',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'n1', label: '芯 n₁', kind: 'number', default: 1.48, min: 1.4, max: 1.6, step: 0.01, unit: '' },
    { key: 'n2', label: '包层 n₂', kind: 'number', default: 1.4, min: 1.3, max: 1.5, step: 0.01, unit: '' },
    { key: 'theta', label: '与轴夹角 θ', kind: 'number', default: 20, min: 5, max: 45, step: 1, unit: '°' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '光纤' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'θc',
      chartKey: 'tc',
      charts: [{ id: 'c', title: '临界角', xLabel: 't', leftLabel: '°', series: [{ key: 'tc', label: 'θc', color: '#fbbf24', unit: '°' }, { key: 'iface', label: '界面角', color: '#a78bfa', unit: '°' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'tc', label: 'θc', unit: '°', tone: 'amber' },
    { key: 'guided', label: '导光', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '光纤全反射传光',
    summary: '芯-包层界面：θc=arcsin(n₂/n₁)。入射界面角大于 θc 时全反射导光。',
    concept: ['全反射', '数值孔径', '导模示意'],
    objectives: ['调 θ 跨临界', '改折射率差', '播放看锯齿路径'],
    formulas: ['\\theta_c=\\arcsin(n_2/n_1)'],
    insight: '金点=光线；越界则逸出包层。',
    legend: [{ color: '#38bdf8', label: '包层' }, { color: '#fbbf24', label: '光线' }],
    steps: [{ id: 'guide', title: '导光', body: '减小 θ 使导光=1。', formulas: ['\\theta_c'], bindings: [{ labelTex: '\\theta_c', valueKey: 'tc', unit: '^\\circ' }] }],
    challenges: [{ id: 'leak', prompt: '增大 θ 使光线逸出（导光=0）。', hint: '调大与轴夹角。', check: { kind: 'paramNear', key: 'theta', target: 40, tol: 8 } }],
  },
}

export function registerFiberDemo() {
  registerDemoBundle({ meta: fiberMeta, model: createFiberModel, adapter: createFiberAdapter })
}
