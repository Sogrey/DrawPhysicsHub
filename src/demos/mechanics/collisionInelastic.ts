import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCollisionInelasticAdapter } from './collisionInelasticAdapter'

/** 恢复系数 e：v2'−v1' = −e(u2−u1)；动量守恒 */
export function inelasticVel(m1: number, m2: number, u1: number, u2: number, e: number) {
  const s = m1 + m2
  const v1 = ((m1 - e * m2) / s) * u1 + ((m2 * (1 + e)) / s) * u2
  const v2 = ((m1 * (1 + e)) / s) * u1 + ((m2 - e * m1) / s) * u2
  return { v1, v2 }
}

function radiusOf(m: number) {
  return 0.28 + 0.12 * Math.cbrt(Math.max(0.2, m))
}

export function createCollisionInelasticModel(): PhysicsModel {
  let m1 = 1
  let m2 = 1.5
  let u1 = 4
  let u2 = 0
  let e = 0.4
  let x10 = -3.2
  let x20 = 1.2
  let t = 0

  function collideTime() {
    const r1 = radiusOf(m1)
    const r2 = radiusOf(m2)
    const closing = u1 - u2
    const gap = x20 - x10 - (r1 + r2)
    if (closing <= 1e-9 || gap < 0) return 0
    return gap / closing
  }

  function period() {
    return collideTime() + 2.4
  }

  function stateAt(time: number) {
    const tc = collideTime()
    const r1 = radiusOf(m1)
    const r2 = radiusOf(m2)
    if (time < tc) {
      return { x1: x10 + u1 * time, x2: x20 + u2 * time, v1: u1, v2: u2, collided: 0, r1, r2, tc }
    }
    const { v1, v2 } = inelasticVel(m1, m2, u1, u2, e)
    const dt = time - tc
    return {
      x1: x10 + u1 * tc + v1 * dt,
      x2: x20 + u2 * tc + v2 * dt,
      v1,
      v2,
      collided: 1,
      r1,
      r2,
      tc,
    }
  }

  return {
    init(params: ParamValues) {
      m1 = Number(params.m1 ?? 1)
      m2 = Number(params.m2 ?? 1.5)
      u1 = Number(params.u1 ?? 4)
      u2 = Number(params.u2 ?? 0)
      e = Number(params.e ?? 0.4)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period(), t + dt)
    },
    seek(time: number) {
      t = Math.min(period(), Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      const K0 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2
      const K = 0.5 * m1 * s.v1 * s.v1 + 0.5 * m2 * s.v2 * s.v2
      const P = m1 * s.v1 + m2 * s.v2
      return {
        time: t,
        values: {
          m1,
          m2,
          u1,
          u2,
          e,
          x1: s.x1,
          x2: s.x2,
          v1: s.v1,
          v2: s.v2,
          r1: s.r1,
          r2: s.r2,
          collided: s.collided,
          K0,
          K,
          dK: K0 - K,
          P,
          tMax: period(),
          done: t >= period() - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.m1 !== undefined) m1 = Number(params.m1)
      if (params.m2 !== undefined) m2 = Number(params.m2)
      if (params.u1 !== undefined) u1 = Number(params.u1)
      if (params.u2 !== undefined) u2 = Number(params.u2)
      if (params.e !== undefined) e = Number(params.e)
    },
  }
}

export const collisionInelasticMeta: DemoMeta = {
  id: 'mech-collision-inelastic',
  subject: '力学',
  category: '动量',
  tags: ['动量', '恢复系数'],
  model: 'collisionInelastic',
  adapter: 'collisionInelastic',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'm1', label: 'm₁', kind: 'number', default: 1, min: 0.4, max: 3, step: 0.1, unit: '' },
    { key: 'm2', label: 'm₂', kind: 'number', default: 1.5, min: 0.4, max: 3, step: 0.1, unit: '' },
    { key: 'u1', label: 'u₁', kind: 'number', default: 4, min: 1, max: 6, step: 0.5, unit: '' },
    { key: 'e', label: '恢复系数 e', kind: 'number', default: 0.4, min: 0, max: 1, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '碰撞' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: '动能',
      chartKey: 'K',
      charts: [
        {
          id: 'k',
          title: '动能',
          xLabel: 't',
          leftLabel: 'K',
          series: [
            { key: 'K', label: 'K', color: '#fbbf24', unit: '' },
            { key: 'P', label: 'P', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'e', label: 'e', unit: '', tone: 'purple' },
    { key: 'K', label: 'K', unit: '', tone: 'amber' },
    { key: 'dK', label: 'ΔK', unit: '', tone: 'pink' },
  ],
  docs: {
    title: '一维非弹性碰撞',
    summary: '恢复系数 e∈[0,1]：e=1 弹性，e=0 完全非弹性。动量守恒，动能一般损失。',
    concept: ['动量守恒', 'v₂′−v₁′=−e(u₂−u₁)', 'e=0 粘在一起'],
    objectives: ['调 e 看分离速度', '观察动能损失', '对照弹性碰撞演示'],
    formulas: ['m_1v_1+m_2v_2=m_1u_1+m_2u_2', 'v_2-v_1=-e(u_2-u_1)'],
    insight: '青/橙两球；e↓ 则碰后相对速度↓，ΔK↑。',
    legend: [
      { color: '#38bdf8', label: 'm₁' },
      { color: '#f97316', label: 'm₂' },
    ],
    steps: [
      {
        id: 'e0',
        title: '完全非弹性',
        body: 'e→0，两球同速。',
        formulas: ['e=0'],
        bindings: [
          { labelTex: 'e', valueKey: 'e', unit: '' },
          { labelTex: '\\Delta K', valueKey: 'dK', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'soft',
        prompt: '取 e≤0.2，播放过碰撞。',
        hint: '调恢复系数。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'e', target: 0.1, tol: 0.15 },
            { kind: 'valueNear', key: 'collided', target: 1, tol: 0.5 },
          ],
        },
      },
    ],
  },
}

export function registerCollisionInelasticDemo(): void {
  registerDemoBundle({
    meta: collisionInelasticMeta,
    model: createCollisionInelasticModel,
    adapter: createCollisionInelasticAdapter,
  })
}
