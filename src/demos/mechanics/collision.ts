import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCollisionAdapter } from './collisionAdapter'

function radiusOf(m: number) {
  return 0.28 + 0.12 * Math.cbrt(Math.max(0.2, m))
}

function elasticVel(m1: number, m2: number, u1: number, u2: number) {
  const s = m1 + m2
  return {
    v1: ((m1 - m2) / s) * u1 + ((2 * m2) / s) * u2,
    v2: ((2 * m1) / s) * u1 + ((m2 - m1) / s) * u2,
  }
}

/** 一维理想弹性碰撞（两质点沿 x 轴） */
export function createCollisionModel(): PhysicsModel {
  let m1 = 1
  let m2 = 1
  let u1 = 4
  let u2 = 0
  let x10 = -3.2
  let x20 = 1.2
  let t = 0
  let trail1: number[][] = []
  let trail2: number[][] = []

  function radii() {
    return { r1: radiusOf(m1), r2: radiusOf(m2) }
  }

  function collideTime() {
    const { r1, r2 } = radii()
    const closing = u1 - u2
    const gap = x20 - x10 - (r1 + r2)
    if (closing <= 1e-9 || gap < 0) return 0
    return gap / closing
  }

  function processEnd() {
    // 碰撞后再跑一段，便于观察分离
    return collideTime() + 2.2
  }

  function stateAt(time: number) {
    const tc = collideTime()
    const { r1, r2 } = radii()
    if (time < tc - 1e-12) {
      return {
        x1: x10 + u1 * time,
        x2: x20 + u2 * time,
        v1: u1,
        v2: u2,
        collided: 0,
        tc,
        r1,
        r2,
      }
    }
    const { v1, v2 } = elasticVel(m1, m2, u1, u2)
    const dt = time - tc
    const x1c = x10 + u1 * tc
    const x2c = x20 + u2 * tc
    return {
      x1: x1c + v1 * dt,
      x2: x2c + v2 * dt,
      v1,
      v2,
      collided: 1,
      tc,
      r1,
      r2,
    }
  }

  function rebuildTrails(upto: number) {
    trail1 = []
    trail2 = []
    if (upto <= 0) {
      const s = stateAt(0)
      trail1.push([s.x1, 0])
      trail2.push([s.x2, 0])
      return
    }
    const n = Math.max(2, Math.ceil(upto / 0.02))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const s = stateAt(ti)
      trail1.push([s.x1, 0])
      trail2.push([s.x2, 0])
    }
  }

  return {
    init(params: ParamValues) {
      m1 = Number(params.m1 ?? 1)
      m2 = Number(params.m2 ?? 1)
      u1 = Number(params.u1 ?? 4)
      u2 = Number(params.u2 ?? 0)
      x10 = Number(params.x10 ?? -3.2)
      x20 = Number(params.x20 ?? 1.2)
      t = 0
      rebuildTrails(0)
    },
    step(dt: number) {
      const T = processEnd()
      t = Math.min(T, t + dt)
      const s = stateAt(t)
      trail1.push([s.x1, 0])
      trail2.push([s.x2, 0])
    },
    seek(time: number) {
      const T = processEnd()
      t = Math.min(T, Math.max(0, time))
      rebuildTrails(t)
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      const T = processEnd()
      const p = m1 * s.v1 + m2 * s.v2
      const ke = 0.5 * m1 * s.v1 * s.v1 + 0.5 * m2 * s.v2 * s.v2
      const p0 = m1 * u1 + m2 * u2
      const ke0 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2
      return {
        time: t,
        values: {
          x1: s.x1,
          x2: s.x2,
          v1: s.v1,
          v2: s.v2,
          m1,
          m2,
          u1,
          u2,
          r1: s.r1,
          r2: s.r2,
          tCollide: s.tc,
          collided: s.collided,
          momentum: p,
          ke,
          momentum0: p0,
          ke0,
          tMax: T,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: {
          path1: trail1.map((p) => [...p]),
          path2: trail2.map((p) => [...p]),
        },
      }
    },
    reset() {
      t = 0
      rebuildTrails(0)
    },
    setParams(params) {
      if (params.m1 !== undefined) m1 = Number(params.m1)
      if (params.m2 !== undefined) m2 = Number(params.m2)
      if (params.u1 !== undefined) u1 = Number(params.u1)
      if (params.u2 !== undefined) u2 = Number(params.u2)
      if (params.x10 !== undefined) x10 = Number(params.x10)
      if (params.x20 !== undefined) x20 = Number(params.x20)
    },
  }
}

export const collisionMeta: DemoMeta = {
  id: 'mech-collision-1d',
  subject: '力学',
  category: '动量',
  tags: ['碰撞', '动量守恒', '弹性'],
  model: 'collision1d',
  adapter: 'collision1d',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'm1',
      label: '质量 m₁',
      kind: 'number',
      default: 1,
      min: 0.3,
      max: 5,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'm2',
      label: '质量 m₂',
      kind: 'number',
      default: 1,
      min: 0.3,
      max: 5,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'u1',
      label: '初速 u₁',
      kind: 'number',
      default: 4,
      min: -6,
      max: 8,
      step: 0.2,
      unit: 'm/s',
    },
    {
      key: 'u2',
      label: '初速 u₂',
      kind: 'number',
      default: 0,
      min: -6,
      max: 6,
      step: 0.2,
      unit: 'm/s',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '碰撞' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'v1',
      charts: [
        {
          id: 'pos',
          title: '位置 · x₁(t) / x₂(t)',
          xLabel: 't (s)',
          leftLabel: 'x (m)',
          series: [
            { key: 'x1', label: 'x₁', color: '#38bdf8', unit: 'm' },
            { key: 'x2', label: 'x₂', color: '#f97316', unit: 'm' },
          ],
        },
        {
          id: 'vel',
          title: '速度 · v₁(t) / v₂(t)',
          xLabel: 't (s)',
          leftLabel: 'v (m/s)',
          series: [
            { key: 'v1', label: 'v₁', color: '#60a5fa', unit: 'm/s' },
            { key: 'v2', label: 'v₂', color: '#fb923c', unit: 'm/s' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'x1', label: 'x₁', unit: 'm', tone: 'slate' },
    { key: 'x2', label: 'x₂', unit: 'm', tone: 'slate' },
    { key: 'v1', label: 'v₁', unit: 'm/s', tone: 'blue' },
    { key: 'v2', label: 'v₂', unit: 'm/s', tone: 'amber' },
    { key: 'momentum', label: 'p', unit: 'kg·m/s', tone: 'green' },
    { key: 'ke', label: 'Eₖ', unit: 'J', tone: 'purple' },
    { key: 'tCollide', label: 't撞', unit: 's', tone: 'cyan', digits: 3 },
  ],
  docs: {
    title: '一维弹性碰撞',
    summary:
      '两球沿直线做理想弹性碰撞：动量与动能均守恒。调节质量与初速，观察碰后速度交换或“追击/反弹”情形。',
    concept: [
      '一维弹性碰撞同时满足动量守恒与动能守恒，可由初态唯一确定碰后速度。',
      '等质量对心碰撞时速度交换；若靶球静止，入射球停下、靶球带走原速。质量差越大，轻球碰后速度变化越剧烈。',
    ],
    objectives: [
      '验证碰前碰后动量守恒',
      '观察等质量时速度交换',
      '体会质量比对碰后速度的影响',
    ],
    formulas: [
      'm_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2',
      'v_1 = \\dfrac{m_1-m_2}{m_1+m_2}u_1 + \\dfrac{2m_2}{m_1+m_2}u_2',
      'v_2 = \\dfrac{2m_1}{m_1+m_2}u_1 + \\dfrac{m_2-m_1}{m_1+m_2}u_2',
    ],
    insight: '读数中 p 与 Eₖ 在碰撞前后应保持不变（数值误差除外）。拖动时间轴可对准碰撞时刻。',
    legend: [
      { color: '#38bdf8', label: '球 1' },
      { color: '#f97316', label: '球 2' },
      { id: 'compare', color: '#f472b6', label: '对比轨迹' },
      { color: '#a78bfa', label: '碰撞瞬间' },
    ],
    steps: [
      {
        id: 'setup',
        title: '初态',
        body: '两球沿同一直线运动，半径按质量略缩放，便于辨认。',
        formulas: ['p_0 = m_1 u_1 + m_2 u_2'],
        bindings: [
          { labelTex: 'm_1', valueKey: 'm1', unit: 'kg' },
          { labelTex: 'm_2', valueKey: 'm2', unit: 'kg' },
          { labelTex: 'u_1', valueKey: 'u1', unit: 'm/s' },
          { labelTex: 'u_2', valueKey: 'u2', unit: 'm/s' },
        ],
      },
      {
        id: 'impact',
        title: '碰撞时刻',
        body: '相对接近并接触时发生瞬时弹性碰撞，速度跃变。',
        formulas: ['t_{\\mathrm{c}} = \\dfrac{\\Delta x - (r_1+r_2)}{u_1-u_2}'],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's', digits: 3 },
          { labelTex: 't_{\\mathrm{c}}', valueKey: 'tCollide', unit: 's', digits: 3 },
          { labelTex: 'v_1', valueKey: 'v1', unit: 'm/s' },
          { labelTex: 'v_2', valueKey: 'v2', unit: 'm/s' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'conserve',
        title: '守恒量',
        body: '理想弹性碰撞：总动量与总动能不变。',
        formulas: ['p = \\mathrm{const}', 'E_k = \\mathrm{const}'],
        bindings: [
          { labelTex: 'p', valueKey: 'momentum', unit: 'kg m/s' },
          { labelTex: 'p_0', valueKey: 'momentum0', unit: 'kg m/s' },
          { labelTex: 'E_k', valueKey: 'ke', unit: 'J' },
          { labelTex: 'E_{k0}', valueKey: 'ke0', unit: 'J' },
        ],
      },
    ],
    challenges: [
      {
        id: 'exchange',
        prompt: '保持 m₁=m₂=1，u₂=0，播放后观察：碰后是否近似 v₁≈0、v₂≈u₁。',
        hint: '等质量、靶静止时速度交换。可把时间轴拖到碰撞之后看读数。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'm1', target: 1, tol: 0.05 },
            { kind: 'paramNear', key: 'm2', target: 1, tol: 0.05 },
            { kind: 'paramNear', key: 'u2', target: 0, tol: 0.05 },
          ],
        },
      },
      {
        id: 'heavy-light',
        prompt: '令 m₁≈3、m₂≈0.5，体会轻球被“弹开”。',
        hint: '增大入射球质量、减小靶球质量。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'm1', target: 3, tol: 0.25 },
            { kind: 'paramNear', key: 'm2', target: 0.5, tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerCollisionDemo(): void {
  registerDemoBundle({
    meta: collisionMeta,
    model: createCollisionModel,
    adapter: createCollisionAdapter,
  })
}
