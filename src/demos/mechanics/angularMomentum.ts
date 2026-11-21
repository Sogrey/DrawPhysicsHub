import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createAngularMomentumAdapter } from './angularMomentumAdapter'

/**
 * 质点对定点 O 的角动量示意：
 * 匀速直线运动 y=b、v=v î，则 L_z = x p_y − y p_x = −m v b（守恒）
 * 力臂为撞击参数 b；|L|=m v b。
 */
export function createAngularMomentumModel(): PhysicsModel {
  let m = 1
  let v = 2
  let b = 1.5
  let t = 0
  let trail: number[][] = []

  const X_SPAN = 5 // 从 -X_SPAN 跑到 +X_SPAN

  function x0() {
    return -X_SPAN
  }

  function processEnd() {
    return (2 * X_SPAN) / Math.max(1e-9, v)
  }

  function stateAt(time: number) {
    const x = x0() + v * time
    const y = b
    const px = m * v
    const py = 0
    const Lz = x * py - y * px // = -m v b
    const r = Math.hypot(x, y)
    const speed = v
    const Lmag = Math.abs(Lz)
    // 力臂：O 到速度线的垂直距离 = |b|
    const lever = Math.abs(b)
    return { x, y, px, py, vx: v, vy: 0, Lz, Lmag, r, speed, lever }
  }

  function rebuildTrail(upto: number) {
    trail = []
    const n = Math.max(2, Math.ceil(upto / 0.02))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const s = stateAt(ti)
      trail.push([s.x, s.y])
    }
  }

  return {
    init(params: ParamValues) {
      m = Number(params.m ?? 1)
      v = Number(params.v ?? 2)
      b = Number(params.b ?? 1.5)
      t = 0
      const s = stateAt(0)
      trail = [[s.x, s.y]]
    },
    step(dt: number) {
      const T = processEnd()
      t = Math.min(T, t + dt)
      const s = stateAt(t)
      trail.push([s.x, s.y])
    },
    seek(time: number) {
      const T = processEnd()
      t = Math.min(T, Math.max(0, time))
      rebuildTrail(t)
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      const T = processEnd()
      const Ltheory = -m * v * b
      return {
        time: t,
        values: {
          m,
          v,
          b,
          x: s.x,
          y: s.y,
          vx: s.vx,
          vy: s.vy,
          px: s.px,
          py: s.py,
          Lz: s.Lz,
          Lmag: s.Lmag,
          r: s.r,
          lever: s.lever,
          Ltheory,
          /** Lz − (−mvb) */
          residual: s.Lz - Ltheory,
          xSpan: X_SPAN,
          tMax: T,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
      const s = stateAt(0)
      trail = [[s.x, s.y]]
    },
    setParams(params) {
      if (params.m !== undefined) m = Number(params.m)
      if (params.v !== undefined) v = Number(params.v)
      if (params.b !== undefined) b = Number(params.b)
    },
  }
}

export const angularMomentumMeta: DemoMeta = {
  id: 'mech-angular-momentum',
  subject: '力学',
  category: '动量和角动量',
  tags: ['角动量', '力臂', '守恒', '对点'],
  model: 'angularMomentum',
  adapter: 'angularMomentum',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'm',
      label: '质量 m',
      kind: 'number',
      default: 1,
      min: 0.4,
      max: 3,
      step: 0.1,
      unit: 'kg',
    },
    {
      key: 'v',
      label: '速率 v',
      kind: 'number',
      default: 2,
      min: 0.5,
      max: 4,
      step: 0.1,
      unit: 'm/s',
    },
    {
      key: 'b',
      label: '撞击参数 b',
      kind: 'number',
      default: 1.5,
      min: 0.3,
      max: 3,
      step: 0.1,
      unit: 'm',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '对点 O' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'Lz',
      charts: [
        {
          id: 'L',
          title: '角动量 L_z(t)',
          xLabel: 't (s)',
          leftLabel: 'L_z (kg·m²/s)',
          series: [
            { key: 'Lz', label: 'L_z', color: '#a78bfa', unit: 'kg·m²/s' },
            { key: 'Ltheory', label: '−mvb', color: '#f472b6', unit: 'kg·m²/s' },
          ],
        },
        {
          id: 'r',
          title: '到 O 的距离 r(t)',
          xLabel: 't (s)',
          leftLabel: 'r (m)',
          series: [{ key: 'r', label: 'r', color: '#38bdf8', unit: 'm' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'x', label: 'x', unit: 'm', tone: 'slate' },
    { key: 'Lz', label: 'L_z', unit: 'kg·m²/s', tone: 'purple' },
    { key: 'Lmag', label: '|L|', unit: 'kg·m²/s', tone: 'amber' },
    { key: 'lever', label: '力臂 b', unit: 'm', tone: 'green' },
    { key: 'r', label: 'r', unit: 'm', tone: 'blue' },
  ],
  docs: {
    title: '角动量对点',
    summary:
      '质点沿直线匀速掠过定点 O。对 O 的角动量 L=r×p，大小等于 m v b（b 为撞击参数），全程守恒。',
    concept: [
      '对定点 O：L = r × p。平面运动用 L_z = x p_y − y p_x。',
      '匀速直线运动不受力，对任意定点力矩为零，故角动量守恒；|L|=m v b，b 为速度线到 O 的垂直距离。',
      '即使轨迹是直线、不绕 O 转圈，只要力臂 b≠0，角动量一般也不为零。',
    ],
    objectives: [
      '写出 L_z = −m v b 并读出力臂',
      '验证 L_z 不随时间改变',
      '区分 |r| 变化与 |L| 不变',
    ],
    formulas: [
      '\\vec L = \\vec r \\times \\vec p',
      'L_z = x p_y - y p_x = -m v b',
      '|\\vec L| = m v b',
    ],
    insight:
      '紫箭头示意 r，绿箭头为 p；虚线标出力臂 b。拖动时间轴：r 在变，但 L_z 读数应保持恒定。',
    legend: [
      { color: '#38bdf8', label: '轨迹' },
      { id: 'compare', color: '#f472b6', label: '速度线 / 力臂' },
      { color: '#a78bfa', label: '位矢 r' },
      { color: '#4ade80', label: '动量 p' },
    ],
    steps: [
      {
        id: 'def',
        title: '定义',
        body: '选原点 O，写出平面分量形式。',
        formulas: ['L_z=x p_y-y p_x', '\\vec p=m\\vec v'],
        bindings: [
          { labelTex: 'm', valueKey: 'm', unit: 'kg' },
          { labelTex: 'v', valueKey: 'v', unit: 'm/s' },
          { labelTex: 'b', valueKey: 'b', unit: 'm' },
        ],
      },
      {
        id: 'const',
        title: '守恒与力臂',
        body: '直线匀速 ⇒ 力臂恒为 b，L_z=−mvb 为常量。',
        formulas: ['L_z=-m v b', '|L|=m v b'],
        bindings: [
          { labelTex: 'L_z', valueKey: 'Lz', unit: 'kg\\cdot m^2/s' },
          { labelTex: '-mvb', valueKey: 'Ltheory', unit: 'kg\\cdot m^2/s' },
          { labelTex: 'r', valueKey: 'r', unit: 'm' },
        ],
        highlightOn: 'scrub',
      },
    ],
    challenges: [
      {
        id: 'Lz-const',
        prompt: '任意时刻确认 residual≈0（L_z 等于 −mvb）。',
        hint: '解析运动严格守恒。',
        check: { kind: 'valueNear', key: 'residual', target: 0, tol: 0.05 },
      },
      {
        id: 'mvb',
        prompt: '取 m=1、v=2、b=1.5，使 |L|≈3 kg·m²/s。',
        hint: '|L|=mvb=1×2×1.5=3。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'm', target: 1, tol: 0.05 },
            { kind: 'paramNear', key: 'v', target: 2, tol: 0.05 },
            { kind: 'paramNear', key: 'b', target: 1.5, tol: 0.05 },
            { kind: 'valueNear', key: 'Lmag', target: 3, tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerAngularMomentumDemo(): void {
  registerDemoBundle({
    meta: angularMomentumMeta,
    model: createAngularMomentumModel,
    adapter: createAngularMomentumAdapter,
  })
}
