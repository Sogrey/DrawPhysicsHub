import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCentralForceAdapter } from './centralForceAdapter'

/** 有心力 a = −k/r² \hat r（开普勒型） */
export function centralAccel(k: number, x: number, y: number): { ax: number; ay: number; r: number } {
  const r = Math.hypot(x, y)
  const r3 = Math.max(1e-6, r * r * r)
  return { ax: (-k * x) / r3, ay: (-k * y) / r3, r }
}

export function createCentralForceModel(): PhysicsModel {
  let k = 4
  let e = 0.4 // eccentricity via L and E setup
  let t = 0
  const period = 12
  let trail: number[][] = []

  function stateAt(time: number) {
    // periapsis r_p = a(1-e); circular-ish start at periapsis with v_perp
    const a = 2.2
    const rp = a * (1 - Math.min(0.85, Math.max(0, e)))
    // vis-viva / circular at peri for ellipse approx: v = sqrt(k(1+e)/(a(1-e)))
    const vPerp = Math.sqrt((k * (1 + e)) / Math.max(0.2, a * (1 - e)))
    let x = rp
    let y = 0
    let vx = 0
    let vy = vPerp
    trail = [[x, y]]
    const T = Math.min(period, Math.max(0, time))
    const dt = 1 / 200
    let tau = 0
    while (tau < T - 1e-12) {
      const h = Math.min(dt, T - tau)
      const a1 = centralAccel(k, x, y)
      vx += a1.ax * h
      vy += a1.ay * h
      x += vx * h
      y += vy * h
      tau += h
      if (trail.length % 2 === 0) trail.push([x, y])
    }
    trail.push([x, y])
    const aNow = centralAccel(k, x, y)
    const speed = Math.hypot(vx, vy)
    const L = x * vy - y * vx
    return { x, y, vx, vy, r: aNow.r, speed, L, ax: aNow.ax, ay: aNow.ay }
  }

  return {
    init(params: ParamValues) {
      k = Number(params.k ?? 4)
      e = Number(params.e ?? 0.4)
      t = 0
      stateAt(0)
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      return {
        time: t,
        values: {
          k,
          e,
          x: s.x,
          y: s.y,
          r: s.r,
          speed: s.speed,
          L: s.L,
          ax: s.ax,
          ay: s.ay,
          period,
          tMax: period,
          world: 4.5,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.k !== undefined) k = Number(params.k)
      if (params.e !== undefined) e = Number(params.e)
    },
  }
}

export const centralForceMeta: DemoMeta = {
  id: 'theo-central-force',
  subject: '理论力学',
  category: '有心力',
  tags: ['有心力', '开普勒', '有效势'],
  model: 'centralForce',
  adapter: 'centralForce',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'k', label: '强度 k', kind: 'number', default: 4, min: 1.5, max: 8, step: 0.5, unit: '' },
    { key: 'e', label: '偏心率 e', kind: 'number', default: 0.4, min: 0, max: 0.8, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '轨道' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'r',
      chartKey: 'r',
      charts: [
        {
          id: 'r',
          title: '径向距离',
          xLabel: 't (s)',
          leftLabel: 'r',
          series: [
            { key: 'r', label: 'r', color: '#fbbf24', unit: '' },
            { key: 'L', label: 'L_z', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'r', label: 'r', unit: '', tone: 'amber' },
    { key: 'L', label: 'L_z', unit: '', tone: 'purple' },
    { key: 'speed', label: '|v|', unit: '', tone: 'green' },
  ],
  docs: {
    title: '有心力轨道（开普勒示意）',
    summary: '力心 −k/r² 下的平面轨道。e=0 近圆；e↑ 椭圆拉长。角动量 L_z 近似守恒。',
    concept: [
      '有心力 ⇒ 角动量守恒、轨道平面固定',
      '1/r² 力 ⇒ 圆锥曲线（束缚态为椭圆）',
      '偏心率控制远/近点比',
    ],
    objectives: ['观察椭圆轨道', '确认 L_z 近似常数', '增大 e 看扁长'],
    formulas: ['\\vec a=-\\frac{k}{r^2}\\hat r', 'L_z=x v_y-y v_x'],
    insight: '金=力心；青=质点；黄=轨迹。粉箭头为加速度（指向力心）。',
    legend: [
      { color: '#fbbf24', label: '力心 / 轨迹' },
      { color: '#38bdf8', label: '质点' },
      { color: '#f472b6', label: '加速度' },
    ],
    steps: [
      {
        id: 'ecc',
        title: '偏心率',
        body: '调 e，看轨道变扁。',
        formulas: ['r_p=a(1-e)'],
        bindings: [
          { labelTex: 'e', valueKey: 'e', unit: '' },
          { labelTex: 'r', valueKey: 'r', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'ellipse',
        prompt: '取 e≈0.5，播放一周量级，使 r 有明显起伏。',
        hint: '偏心率越大起伏越大。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'e', target: 0.5, tol: 0.2 },
            { kind: 'valueNear', key: 't', target: 3, tol: 10 },
          ],
        },
      },
    ],
  },
}

export function registerCentralForceDemo(): void {
  registerDemoBundle({
    meta: centralForceMeta,
    model: createCentralForceModel,
    adapter: createCentralForceAdapter,
  })
}
