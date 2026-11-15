import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemo, registerModel } from '@/core/physics/registry'

const G = 9.8

export function createProjectileModel(): PhysicsModel {
  let v0 = 20
  let angleDeg = 45
  let t = 0
  let trail: number[][] = []

  function stateAt(time: number) {
    const th = (angleDeg * Math.PI) / 180
    const vx = v0 * Math.cos(th)
    const vy0 = v0 * Math.sin(th)
    const x = vx * time
    const y = vy0 * time - 0.5 * G * time * time
    const vy = vy0 - G * time
    return { x, y, vx, vy }
  }

  function flightTime() {
    const th = (angleDeg * Math.PI) / 180
    const vy0 = v0 * Math.sin(th)
    return Math.max(0, (2 * vy0) / G)
  }

  function rebuildTrail(upto: number) {
    trail = [[0, 0]]
    if (upto <= 1e-12) return
    const n = Math.max(2, Math.ceil(upto / 0.02))
    for (let i = 1; i <= n; i++) {
      const ti = (upto * i) / n
      const { x, y } = stateAt(ti)
      if (y >= -1e-9) trail.push([x, Math.max(0, y)])
    }
  }

  return {
    init(params: ParamValues) {
      v0 = Number(params.v0 ?? 20)
      angleDeg = Number(params.angle ?? 45)
      t = 0
      trail = [[0, 0]]
    },
    step(dt: number) {
      const T = flightTime()
      t = Math.min(T, t + dt)
      const { x, y } = stateAt(t)
      if (y >= 0) trail.push([x, y])
    },
    seek(time: number) {
      const T = flightTime()
      t = Math.min(T, Math.max(0, time))
      rebuildTrail(t)
    },
    observe(): ObserveSnapshot {
      const { x, y, vx, vy } = stateAt(t)
      const th = (angleDeg * Math.PI) / 180
      const range = (v0 * v0 * Math.sin(2 * th)) / G
      const hmax = (v0 * v0 * Math.sin(th) ** 2) / (2 * G)
      const tmax = (v0 * Math.sin(th)) / G
      const T = flightTime()
      return {
        time: t,
        values: {
          x,
          y: Math.max(0, y),
          vx,
          vy,
          speed: Math.hypot(vx, vy),
          range,
          hmax,
          tmax,
          flightTime: T,
          angle: angleDeg,
          v0,
          done: t >= T - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
        labels: {
          tip: `R=${range.toFixed(2)} m · H=${hmax.toFixed(2)} m`,
        },
      }
    },
    reset() {
      t = 0
      trail = [[0, 0]]
    },
    setParams(params) {
      if (params.v0 !== undefined) v0 = Number(params.v0)
      if (params.angle !== undefined) angleDeg = Number(params.angle)
    },
  }
}

export const projectileMeta: DemoMeta = {
  id: 'mech-projectile',
  subject: '力学',
  category: '质点运动学',
  tags: ['抛体', '运动学', 'hello'],
  model: 'projectile',
  params: [
    {
      key: 'v0',
      label: '初速 v₀',
      kind: 'number',
      default: 20,
      min: 1,
      max: 50,
      step: 0.5,
      unit: 'm/s',
    },
    {
      key: 'angle',
      label: '仰角 θ',
      kind: 'number',
      default: 45,
      min: 5,
      max: 85,
      step: 1,
      unit: '°',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '轨迹' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    { id: 'chart', kind: 'chart', title: 'y(t)' },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  docs: {
    title: '抛体运动',
    summary:
      '理想斜抛运动：忽略空气阻力，重力恒定向下。拖动滑条改变初速与仰角，观察轨迹、射程与最大高度的实时变化。可用时间轴 scrub，并保留对比轨迹做推理。',
    concept: [
      '斜抛是质点在竖直平面内只受重力时的二维运动。把初速度分解为水平分量 v₀ₓ 与竖直分量 v₀ᵧ 后：水平方向做匀速直线运动，竖直方向做匀变速直线运动（加速度为 −g），二者合成轨迹为抛物线。',
      '本演示取地面为 y=0、抛出点为原点。忽略空气阻力与地球曲率，g 取 9.8 m/s²。拖动时间轴可对照瞬时速度分解；顶点处 vᵧ≈0，落地时 |v| 与出发时相等（机械能守恒的理想情形）。',
    ],
    objectives: [
      '观察初速与仰角对射程、最大高度的影响',
      '理解水平匀速与竖直匀变速的合成',
      '用公式代入与读数互证，验证顶点处 vᵧ≈0',
    ],
    formulas: [
      'x = v_0\\cos\\theta\\, t',
      'y = v_0\\sin\\theta\\, t - \\tfrac12 g t^2',
      'R = \\dfrac{v_0^2\\sin 2\\theta}{g}',
    ],
    insight: '当 θ = 45° 时，理想无阻力条件下射程最大（同初速）。θ 与 90°−θ 射程相同。',
    legend: [
      { color: '#f97316', label: '理论抛物线' },
      { color: '#38bdf8', label: '已飞行轨迹' },
      { color: '#f472b6', label: '对比轨迹' },
      { color: '#ef4444', label: '质点' },
      { color: '#4ade80', label: '速度矢量 v' },
      { color: '#60a5fa', label: 'vₓ 分量' },
      { color: '#fbbf24', label: 'vᵧ 分量' },
      { color: '#cbd5e1', label: '分解/投影辅助线' },
      { color: '#a78bfa', label: '落地射程 R' },
    ],

    steps: [
      {
        id: 'decomp',
        title: '分解初速度',
        body: '将初速按仰角分解为水平与竖直分量。水平方向不受力，竖直方向只受重力。',
        formulas: ['v_{0x} = v_0\\cos\\theta', 'v_{0y} = v_0\\sin\\theta'],
        bindings: [
          { labelTex: 'v_{0x}', valueKey: 'v0x', unit: 'm/s' },
          { labelTex: 'v_{0y}', valueKey: 'v0y', unit: 'm/s' },
        ],
      },
      {
        id: 'motion',
        title: '位置随时间',
        body: '水平匀速、竖直匀变速，合成得到参数方程。拖动时间轴，对照瞬时位置与速度分量。',
        formulas: [
          'x(t) = v_0\\cos\\theta\\, t',
          'y(t) = v_0\\sin\\theta\\, t - \\tfrac12 g t^2',
        ],
        bindings: [
          { labelTex: 't', valueKey: 't', unit: 's' },
          { labelTex: 'x', valueKey: 'x', unit: 'm' },
          { labelTex: 'y', valueKey: 'y', unit: 'm' },
          { labelTex: 'v_x', valueKey: 'vx', unit: 'm/s' },
          { labelTex: 'v_y', valueKey: 'vy', unit: 'm/s' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'range',
        title: '射程与最大高度',
        body: '令 y=0 求飞行时间，再得射程；竖直速度为零时达最大高度。',
        formulas: [
          'R = \\dfrac{v_0^2\\sin 2\\theta}{g}',
          'H = \\dfrac{v_0^2\\sin^2\\theta}{2g}',
        ],
        bindings: [
          { labelTex: 'R', valueKey: 'range', unit: 'm' },
          { labelTex: 'H', valueKey: 'hmax', unit: 'm' },
          { labelTex: 't_{\\mathrm{apex}}', valueKey: 'tmax', unit: 's' },
        ],
      },
    ],
    challenges: [
      {
        id: 'max-range',
        prompt: '保持 v₀=20 m/s，调节 θ 使射程 R 最大。',
        hint: '理想无阻力时，θ = 45° 射程最大。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'v0', target: 20, tol: 0.25 },
            { kind: 'paramNear', key: 'angle', target: 45, tol: 1 },
          ],
        },
      },
      {
        id: 'height-5',
        prompt: '调节参数，使最大高度 H ≈ 5 m（容差 ±0.35 m）。',
        hint: 'H = v₀² sin²θ / (2g)。可先固定 θ=45° 再调 v₀，或固定 v₀ 调 θ。',
        check: { kind: 'valueNear', key: 'hmax', target: 5, tol: 0.35 },
      },
      {
        id: 'complement',
        prompt: '将 θ 调到约 30°，点击「保留对比」，再调到约 60°，观察两段射程是否接近。',
        hint: 'θ 与 90°−θ 的 sin(2θ) 相同，故理想射程相同。',
        check: { kind: 'paramNear', key: 'angle', target: 60, tol: 2 },
      },
    ],
  },
}

export function registerProjectileDemo(): void {
  registerModel('projectile', createProjectileModel)
  registerDemo(projectileMeta)
}
