import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createCollision2dAdapter } from './collision2dAdapter'

/** 等质量二维弹性：沿接触法向交换法向速度分量 */
export function elastic2dEqualMass(
  u1x: number,
  u1y: number,
  u2x: number,
  u2y: number,
  nx: number,
  ny: number,
) {
  const nlen = Math.hypot(nx, ny) || 1
  const nxn = nx / nlen
  const nyn = ny / nlen
  const u1n = u1x * nxn + u1y * nyn
  const u2n = u2x * nxn + u2y * nyn
  const u1tX = u1x - u1n * nxn
  const u1tY = u1y - u1n * nyn
  const u2tX = u2x - u2n * nxn
  const u2tY = u2y - u2n * nyn
  return {
    v1x: u1tX + u2n * nxn,
    v1y: u1tY + u2n * nyn,
    v2x: u2tX + u1n * nxn,
    v2y: u2tY + u1n * nyn,
  }
}

export function createCollision2dModel(): PhysicsModel {
  let b = 0.8
  let u = 3
  let t = 0
  const period = 6
  const R = 0.35

  return {
    init(p: ParamValues) {
      b = Number(p.b ?? 0.8)
      u = Number(p.u ?? 3)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      // 靶静止于原点；入射沿 +x，冲击参数 b
      const x10 = -2.5
      const y10 = b
      const gap = Math.abs(x10) - 2 * R
      const tc = gap / Math.max(1e-6, u)
      let x1: number
      let y1: number
      let x2 = 0
      let y2 = 0
      let v1x = u
      let v1y = 0
      let v2x = 0
      let v2y = 0
      let collided = 0
      if (t < tc) {
        x1 = x10 + u * t
        y1 = y10
      } else {
        collided = 1
        // 接触时法向从靶心指向入射球心
        const cx = x10 + u * tc
        const cy = y10
        const nx = cx
        const ny = cy
        const v = elastic2dEqualMass(u, 0, 0, 0, nx, ny)
        v1x = v.v1x
        v1y = v.v1y
        v2x = v.v2x
        v2y = v.v2y
        const dt = t - tc
        x1 = cx + v1x * dt
        y1 = cy + v1y * dt
        x2 = v2x * dt
        y2 = v2y * dt
      }
      const scatter = (Math.atan2(v1y, v1x) * 180) / Math.PI
      return {
        time: t,
        values: {
          b,
          u,
          x1,
          y1,
          x2,
          y2,
          v1x,
          v1y,
          v2x,
          v2y,
          scatter,
          collided,
          R,
          tc,
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
      if (p.b !== undefined) b = Number(p.b)
      if (p.u !== undefined) u = Number(p.u)
    },
  }
}

export const collision2dMeta: DemoMeta = {
  id: 'mech-collision-2d',
  subject: '力学',
  category: '动量',
  tags: ['二维碰撞', '散射角'],
  model: 'collision2d',
  adapter: 'collision2d',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'b', label: '冲击参数 b', kind: 'number', default: 0.8, min: 0, max: 1.4, step: 0.05, unit: '' },
    { key: 'u', label: '入射速 u', kind: 'number', default: 3, min: 1.5, max: 5, step: 0.25, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '碰撞' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: '角',
      chartKey: 'scatter',
      charts: [
        {
          id: 'sc',
          title: '散射角',
          xLabel: 't',
          leftLabel: 'θ°',
          series: [{ key: 'scatter', label: 'θ', color: '#fbbf24', unit: '°' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'b', label: 'b', unit: '', tone: 'slate' },
    { key: 'scatter', label: 'θ', unit: '°', tone: 'amber' },
  ],
  docs: {
    title: '二维弹性碰撞',
    summary: '等质量弹性碰撞：沿接触法向交换法向动量。冲击参数 b 决定散射角。',
    concept: ['冲击参数', '散射角', '动量守恒'],
    objectives: ['改 b 看散射', '对心碰撞约 90° 分开', '播放看轨迹'],
    formulas: ['\\mathbf{v}_{n}\\ \\mathrm{交换}', '\\theta=\\theta(b)'],
    insight: '金=入射球；青=靶球。b=0 对心。',
    legend: [
      { color: '#fbbf24', label: '入射' },
      { color: '#38bdf8', label: '靶' },
    ],
    steps: [
      {
        id: 'b',
        title: '冲击参数',
        body: '减小 b 看散射角变大。',
        formulas: ['b'],
        bindings: [
          { labelTex: 'b', valueKey: 'b', unit: '' },
          { labelTex: '\\theta', valueKey: 'scatter', unit: '^\\circ' },
        ],
      },
    ],
    challenges: [
      {
        id: 'head',
        prompt: '取 b≈0 做近对心碰撞。',
        hint: '冲击参数调到最小。',
        check: { kind: 'paramNear', key: 'b', target: 0.1, tol: 0.15 },
      },
    ],
  },
}

export function registerCollision2dDemo() {
  registerDemoBundle({
    meta: collision2dMeta,
    model: createCollision2dModel,
    adapter: createCollision2dAdapter,
  })
}
