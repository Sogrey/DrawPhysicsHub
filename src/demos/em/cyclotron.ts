import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCyclotronAdapter } from './cyclotronAdapter'

/**
 * 匀强磁场中带电粒子回旋（教学单位）：
 *   R = m v / (|q| B)，ω = |q| B / m
 *   参数化角速度 ω_s = −q B / m（qB>0 时顺时针，与右手定则一致）
 * B 沿 +z（出纸面 ·）；可反转 B 或 q。
 */
export function createCyclotronModel(): PhysicsModel {
  let q = 1
  let m = 1
  let v = 2
  let B = 1
  let t = 0
  let trail: number[][] = []

  function R() {
    return (m * v) / Math.max(1e-9, Math.abs(q) * Math.abs(B))
  }

  function omegaMag() {
    return (Math.abs(q) * Math.abs(B)) / Math.max(1e-9, m)
  }

  /** 参数化角速度：>0 逆时针 */
  function omegaSigned() {
    return -(q * B) / Math.max(1e-9, m)
  }

  function period() {
    return (2 * Math.PI) / Math.max(1e-9, omegaMag())
  }

  function stateAt(time: number) {
    const Rc = R()
    const ws = omegaSigned()
    const th = ws * time
    const x = Rc * Math.cos(th)
    const y = Rc * Math.sin(th)
    const vx = -Rc * ws * Math.sin(th)
    const vy = Rc * ws * Math.cos(th)
    // F = q (v × Bẑ) = q B (vy, −vx)
    const Fx = q * B * vy
    const Fy = -q * B * vx
    const Fmag = Math.hypot(Fx, Fy)
    return { x, y, vx, vy, Fx, Fy, Fmag, th, Rc }
  }

  function rebuildTrail(upto: number) {
    trail = []
    const n = Math.max(2, Math.ceil(upto / 0.02))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const { x, y } = stateAt(ti)
      trail.push([x, y])
    }
  }

  return {
    init(params: ParamValues) {
      q = Number(params.q ?? 1)
      m = Number(params.m ?? 1)
      v = Number(params.v ?? 2)
      B = Number(params.B ?? 1)
      t = 0
      const { x, y } = stateAt(0)
      trail = [[x, y]]
    },
    step(dt: number) {
      const T = period()
      t = Math.min(T, t + dt)
      const { x, y } = stateAt(t)
      trail.push([x, y])
    },
    seek(time: number) {
      const T = period()
      t = Math.min(T, Math.max(0, time))
      rebuildTrail(t)
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      const T = period()
      const Rc = s.Rc
      const om = omegaMag()
      return {
        time: t,
        values: {
          q,
          m,
          v,
          B,
          R: Rc,
          omega: om,
          omegaSigned: omegaSigned(),
          x: s.x,
          y: s.y,
          vx: s.vx,
          vy: s.vy,
          speed: Math.hypot(s.vx, s.vy),
          Fx: s.Fx,
          Fy: s.Fy,
          Fmag: s.Fmag,
          theta: (s.th * 180) / Math.PI,
          period: T,
          tMax: T,
          world: Math.max(4.5, Rc * 1.6 + 1),
          sense: omegaSigned() >= 0 ? 1 : -1,
          Bout: B >= 0 ? 1 : 0,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
      const { x, y } = stateAt(0)
      trail = [[x, y]]
    },
    setParams(params) {
      if (params.q !== undefined) q = Number(params.q)
      if (params.m !== undefined) m = Number(params.m)
      if (params.v !== undefined) v = Number(params.v)
      if (params.B !== undefined) B = Number(params.B)
    },
  }
}

export const cyclotronMeta: DemoMeta = {
  id: 'em-cyclotron',
  subject: '电磁学',
  category: '洛伦兹力',
  tags: ['洛伦兹力', '回旋', '磁场'],
  model: 'cyclotron',
  adapter: 'cyclotron',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'q',
      label: '电荷 q',
      kind: 'number',
      default: 1,
      min: -2,
      max: 2,
      step: 0.1,
      unit: 'u',
    },
    {
      key: 'm',
      label: '质量 m',
      kind: 'number',
      default: 1,
      min: 0.4,
      max: 3,
      step: 0.1,
      unit: 'u',
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
      key: 'B',
      label: '磁场 B',
      kind: 'number',
      default: 1,
      min: -2,
      max: 2,
      step: 0.1,
      unit: 'u',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '回旋' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'speed',
      charts: [
        {
          id: 'vel',
          title: '速度分量',
          xLabel: 't (s)',
          leftLabel: 'v',
          series: [
            { key: 'vx', label: 'vₓ', color: '#60a5fa', unit: 'm/s' },
            { key: 'vy', label: 'vᵧ', color: '#fbbf24', unit: 'm/s' },
            { key: 'speed', label: '|v|', color: '#34d399', unit: 'm/s' },
          ],
        },
        {
          id: 'force',
          title: '洛伦兹力',
          xLabel: 't (s)',
          leftLabel: 'F',
          series: [
            { key: 'Fx', label: 'Fₓ', color: '#f472b6', unit: 'u' },
            { key: 'Fy', label: 'Fᵧ', color: '#a78bfa', unit: 'u' },
            { key: 'Fmag', label: '|F|', color: '#fb7185', unit: 'u' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'R', label: 'R', unit: 'm', tone: 'green' },
    { key: 'speed', label: '|v|', unit: 'm/s', tone: 'amber' },
    { key: 'Fmag', label: '|F|', unit: 'u', tone: 'purple' },
    { key: 'omega', label: 'ω', unit: 'rad/s', tone: 'blue' },
    { key: 'period', label: 'T', unit: 's', tone: 'slate' },
  ],
  docs: {
    title: '洛伦兹力回旋',
    summary:
      '匀强 B（垂直纸面）中，洛伦兹力提供向心力，带电粒子做匀速圆周。半径 R=mv/(|q|B)；qB>0 时顺时针（B 出纸面）。',
    concept: [
      'F = q v × B，始终垂直速度，只改方向不改速率。',
      '回旋半径 R = m v / (|q| B)，回旋频率 ω = |q| B / m。',
      '反转 q 或 B 会反转旋转方向。',
    ],
    objectives: [
      '读出 R 与参数关系',
      '对照 v 与 F_L 相互垂直',
      '改变 q/B 符号观察旋向',
    ],
    formulas: [
      '\\vec F=q\\,\\vec v\\times\\vec B',
      'R=\\dfrac{mv}{|q|B}',
      '\\omega=\\dfrac{|q|B}{m},\\quad T=\\dfrac{2\\pi}{\\omega}',
    ],
    insight:
      '背景 ·/× 表示 B 方向；粉箭头为 F_L，青箭头为 v。虚线圆为轨道；|v| 应近似恒定。',
    legend: [
      { color: '#94a3b8', label: 'B 方向（·/×）' },
      { color: '#38bdf8', label: '粒子' },
      { color: '#22d3ee', label: '速度 v' },
      { color: '#f472b6', label: '洛伦兹力 F' },
      { id: 'compare', color: '#fbbf24', label: '回旋轨道' },
    ],
    steps: [
      {
        id: 'lorentz',
        title: '洛伦兹力',
        body: '磁力垂直于 v 与 B，充当向心力。',
        formulas: ['\\vec F=q\\vec v\\times\\vec B', '|F|=|q|v|B|'],
        bindings: [
          { labelTex: 'q', valueKey: 'q', unit: 'u' },
          { labelTex: 'v', valueKey: 'v', unit: 'm/s' },
          { labelTex: 'B', valueKey: 'B', unit: 'u' },
          { labelTex: '|F|', valueKey: 'Fmag', unit: 'u' },
        ],
      },
      {
        id: 'radius',
        title: '回旋半径',
        body: '由 |F|=m v²/R 得 R=mv/(|q|B)。',
        formulas: ['R=\\dfrac{mv}{|q|B}'],
        bindings: [
          { labelTex: 'm', valueKey: 'm', unit: 'u' },
          { labelTex: 'R', valueKey: 'R', unit: 'm' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'sense',
        title: '旋向',
        body: '右手定则：B 出纸面时，正电荷顺时针。',
        formulas: ['\\omega_s=-qB/m'],
        bindings: [
          { labelTex: 'q', valueKey: 'q', unit: 'u' },
          { labelTex: 'B', valueKey: 'B', unit: 'u' },
        ],
      },
    ],
    challenges: [
      {
        id: 'radius-check',
        prompt: '取 q=1、m=1、v=2、B=1，使 R≈2。',
        hint: 'R=mv/(|q|B)=2/1=2。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'q', target: 1, tol: 0.1 },
            { kind: 'paramNear', key: 'm', target: 1, tol: 0.1 },
            { kind: 'paramNear', key: 'v', target: 2, tol: 0.1 },
            { kind: 'paramNear', key: 'B', target: 1, tol: 0.1 },
            { kind: 'valueNear', key: 'R', target: 2, tol: 0.1 },
          ],
        },
      },
      {
        id: 'flip-sense',
        prompt: '保持 |q|=1、|B|=1、m=1、v=2，将 q 改为 −1，使旋向反转且 R 仍≈2。',
        hint: '只改 q 符号；半径公式含 |q|。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'q', target: -1, tol: 0.1 },
            { kind: 'paramNear', key: 'B', target: 1, tol: 0.15 },
            { kind: 'paramNear', key: 'v', target: 2, tol: 0.15 },
            { kind: 'valueNear', key: 'R', target: 2, tol: 0.15 },
            { kind: 'valueNear', key: 'sense', target: 1, tol: 0.1 },
          ],
        },
      },
    ],
  },
}

export function registerCyclotronDemo(): void {
  registerDemoBundle({
    meta: cyclotronMeta,
    model: createCyclotronModel,
    adapter: createCyclotronAdapter,
  })
}
