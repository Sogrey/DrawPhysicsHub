import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createVelocityAddAdapter } from './velocityAddAdapter'

/** 共线相对论速度合成：w=(u+v)/(1+uv/c²)，c=1 */
export function velocityAdd(u: number, v: number): number {
  return (u + v) / (1 + u * v)
}

export function createVelocityAddModel(): PhysicsModel {
  let u = 0.6
  let v = 0.6
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      u = Number(p.u ?? 0.6)
      v = Number(p.v ?? 0.6)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const uu = Math.max(-0.95, Math.min(0.95, u))
      const vv = Math.max(-0.95, Math.min(0.95, v))
      const w = velocityAdd(uu, vv)
      const classical = uu + vv
      // 播放：沿 v 轴扫探针，曲线上点随之移动
      const vProbe = -0.9 + (1.8 * t) / period
      const wProbe = velocityAdd(uu, vProbe)
      const classicalProbe = uu + vProbe
      const path: number[][] = []
      const classicalPath: number[][] = []
      for (let i = 0; i <= 40; i++) {
        const vi = -0.9 + (1.8 * i) / 40
        path.push([vi, velocityAdd(uu, vi)])
        classicalPath.push([vi, uu + vi])
      }
      return {
        time: t,
        values: {
          u: uu,
          v: vv,
          w,
          classical,
          gap: classical - w,
          vProbe,
          wProbe,
          classicalProbe,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path, classicalPath },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.u !== undefined) u = Number(p.u)
      if (p.v !== undefined) v = Number(p.v)
    },
  }
}

export const velocityAddMeta: DemoMeta = {
  id: 'rel-velocity-add',
  subject: '近代物理',
  category: '狭义相对论',
  tags: ['速度合成', '相对论'],
  model: 'velocityAdd',
  adapter: 'velocityAdd',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'u', label: 'u/c', kind: 'number', default: 0.6, min: -0.9, max: 0.9, step: 0.05, unit: '' },
    { key: 'v', label: 'v/c', kind: 'number', default: 0.6, min: -0.9, max: 0.9, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '合成' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'w',
      chartKey: 'wProbe',
      charts: [
        {
          id: 'w',
          title: '探针合成速度',
          xLabel: 't',
          leftLabel: 'β',
          series: [
            { key: 'wProbe', label: 'w(探针)', color: '#fbbf24', unit: '' },
            { key: 'classicalProbe', label: 'u+v(经典)', color: '#f472b6', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'u', label: 'u', unit: '', tone: 'blue' },
    { key: 'vProbe', label: 'v探针', unit: '', tone: 'slate' },
    { key: 'wProbe', label: 'w', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '相对论速度合成',
    summary: '共线：w=(u+v)/(1+uv)（c=1）。永远 |w|<1，不同于经典 u+v。',
    concept: ['速度合成', '光速不变', '快速度'],
    objectives: ['取 u=v=0.6 对比经典', '播放扫 v 看 |w|<1', '逼近 c'],
    formulas: ['w=(u+v)/(1+uv/c^2)'],
    insight: '金=相对论合成；粉=经典和；播放扫 v 探针。',
    legend: [
      { color: '#fbbf24', label: '相对论' },
      { color: '#f472b6', label: '经典' },
    ],
    steps: [
      {
        id: 'cmp',
        title: '对比',
        body: '播放观察探针处相对论与经典分叉。',
        formulas: ['w'],
        bindings: [{ labelTex: 'w', valueKey: 'wProbe', unit: '' }],
      },
    ],
    challenges: [
      {
        id: 'fast',
        prompt: '取 u≥0.8。',
        hint: '调 u。',
        check: { kind: 'paramNear', key: 'u', target: 0.85, tol: 0.1 },
      },
    ],
  },
}

export function registerVelocityAddDemo() {
  registerDemoBundle({
    meta: velocityAddMeta,
    model: createVelocityAddModel,
    adapter: createVelocityAddAdapter,
  })
}
