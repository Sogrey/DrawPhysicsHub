import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { rutherfordOrbitSync } from '@/core/physics/worker/workerClient'
import { createAlphaAdapter } from './alphaAdapter'

/** 卢瑟福散射角（库仑）：θ = π − 2 arctan(2 b E / α) ；教学 α=1、E=v0²/2 → 简化示意用数值轨道 */
export function createAlphaModel(): PhysicsModel {
  let b = 1.2
  let v0 = 1.8
  let soft = 0.15
  let t = 0
  const period = 10
  let xs = new Float32Array(0)
  let ys = new Float32Array(0)
  let n = 0
  let theta = 0

  function recompute() {
    const out = rutherfordOrbitSync(b, v0, soft, 0.01, 1200)
    xs = out.xs.length === out.n ? out.xs : out.xs.slice(0, out.n)
    ys = out.ys.length === out.n ? out.ys : out.ys.slice(0, out.n)
    n = out.n
    theta = out.theta
  }

  return {
    init(params: ParamValues) {
      b = Number(params.b ?? 1.2)
      v0 = Number(params.v0 ?? 1.8)
      soft = Number(params.soft ?? 0.15)
      t = 0
      recompute()
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const u = t / period
      const idx = Math.max(0, Math.min(n - 1, Math.floor(u * (n - 1))))
      const x = n > 0 ? xs[idx]! : -8
      const y = n > 0 ? ys[idx]! : b
      const thetaDeg = (theta * 180) / Math.PI
      return {
        time: t,
        values: {
          b,
          v0,
          soft,
          x,
          y,
          n,
          idx,
          theta,
          thetaDeg,
          xs,
          ys,
          period,
          tMax: period,
          world: 8,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      let dirty = false
      if (params.b !== undefined) {
        b = Number(params.b)
        dirty = true
      }
      if (params.v0 !== undefined) {
        v0 = Number(params.v0)
        dirty = true
      }
      if (params.soft !== undefined) {
        soft = Number(params.soft)
        dirty = true
      }
      if (dirty) recompute()
    },
  }
}

export const alphaMeta: DemoMeta = {
  id: 'qm-alpha',
  subject: '量子力学',
  category: '近代实验',
  tags: ['卢瑟福', 'α散射', 'Worker'],
  model: 'alpha',
  adapter: 'alpha',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'b', label: '瞄准距离 b', kind: 'number', default: 1.2, min: 0.3, max: 3, step: 0.1, unit: '' },
    { key: 'v0', label: '入射速率 v₀', kind: 'number', default: 1.8, min: 0.8, max: 3, step: 0.1, unit: '' },
    { key: 'soft', label: '软化 ε', kind: 'number', default: 0.15, min: 0.05, max: 0.4, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '轨道' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '散射角',
      chartKey: 'thetaDeg',
      charts: [
        {
          id: 'theta',
          title: '出射角',
          xLabel: 't (s)',
          leftLabel: 'θ°',
          series: [{ key: 'thetaDeg', label: 'θ', color: '#f472b6', unit: '°' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'b', label: 'b', unit: '', tone: 'slate' },
    { key: 'v0', label: 'v₀', unit: '', tone: 'blue' },
    { key: 'thetaDeg', label: 'θ', unit: '°', tone: 'purple' },
    { key: 'x', label: 'x', unit: '', tone: 'amber' },
    { key: 'y', label: 'y', unit: '', tone: 'green' },
  ],
  docs: {
    title: 'α 散射轨道（Worker 数值）',
    summary:
      '库仑排斥下 α 粒子双曲线型散射。数值积分可走 WebWorker 管线（本演示默认同步后备以保证可测）。减小 b 增大偏转。',
    concept: [
      '瞄准距离越小，散射角越大',
      '大角散射支持原子有致密原子核',
      '重数值步进可卸载到 Worker，避免卡主线程',
    ],
    objectives: ['观察双曲线型轨道', '减小 b 看偏转增大', '了解 Worker 数值管线'],
    formulas: [
      'm\\ddot{\\mathbf r}=\\alpha\\,\\mathbf r/r^3',
      '\\theta=\\theta(b,E)',
    ],
    insight: '金点=原子核；青线=整条轨道；粉点=当前粒子。轨道由 rutherfordOrbitSync / Worker 计算。',
    legend: [
      { color: '#fbbf24', label: '原子核' },
      { color: '#38bdf8', label: '轨道' },
      { color: '#f472b6', label: 'α 粒子' },
    ],
    steps: [
      {
        id: 'impact',
        title: '瞄准距离',
        body: '减小 b，散射角增大。',
        formulas: ['b\\downarrow\\Rightarrow|\\theta|\\uparrow'],
        bindings: [
          { labelTex: 'b', valueKey: 'b', unit: '' },
          { labelTex: '\\theta', valueKey: 'thetaDeg', unit: '°' },
        ],
      },
    ],
    challenges: [
      {
        id: 'close',
        prompt: '取 b≈0.5，使 |θ| 明显偏离 0。',
        hint: '瞄准更近。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'b', target: 0.5, tol: 0.2 },
          ],
        },
      },
    ],
  },
}

export function registerAlphaDemo(): void {
  registerDemoBundle({
    meta: alphaMeta,
    model: createAlphaModel,
    adapter: createAlphaAdapter,
  })
}
