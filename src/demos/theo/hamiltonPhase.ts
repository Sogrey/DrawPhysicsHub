import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createHamiltonPhaseAdapter } from './hamiltonPhaseAdapter'

/** 谐振子 H=p²/2m + ½ m ω² q² → 椭圆轨 */
export function hamiltonPoint(q0: number, omega: number, t: number, m = 1) {
  const q = q0 * Math.cos(omega * t)
  const p = -m * omega * q0 * Math.sin(omega * t)
  const H = (p * p) / (2 * m) + 0.5 * m * omega * omega * q * q
  return { q, p, H }
}

export function createHamiltonPhaseModel(): PhysicsModel {
  let q0 = 1.2
  let omega = 1.2
  let t = 0
  const period = 10

  return {
    init(p: ParamValues) {
      q0 = Number(p.q0 ?? 1.2)
      omega = Number(p.omega ?? 1.2)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const { q, p, H } = hamiltonPoint(q0, omega, t)
      const path: number[][] = []
      for (let i = 0; i <= 80; i++) {
        const tt = (2 * Math.PI * i) / (80 * omega)
        const pt = hamiltonPoint(q0, omega, tt)
        path.push([pt.q, pt.p])
      }
      return {
        time: t,
        values: {
          q0,
          omega,
          q,
          p,
          H,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.q0 !== undefined) q0 = Number(p.q0)
      if (p.omega !== undefined) omega = Number(p.omega)
    },
  }
}

export const hamiltonPhaseMeta: DemoMeta = {
  id: 'theo-hamilton-phase',
  subject: '理论力学',
  category: '哈密顿力学',
  tags: ['哈密顿', '相空间'],
  model: 'hamiltonPhase',
  adapter: 'hamiltonPhase',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'q0', label: '振幅 q₀', kind: 'number', default: 1.2, min: 0.4, max: 2, step: 0.1, unit: '' },
    { key: 'omega', label: 'ω', kind: 'number', default: 1.2, min: 0.5, max: 2.5, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '相空间' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'H',
      chartKey: 'H',
      charts: [{ id: 'h', title: '能量', xLabel: 't', leftLabel: 'H', series: [{ key: 'H', label: 'H', color: '#a78bfa', unit: '' }, { key: 'q', label: 'q', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'q', label: 'q', unit: '', tone: 'amber' },
    { key: 'p', label: 'p', unit: '', tone: 'blue' },
    { key: 'H', label: 'H', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '哈密顿相空间轨道',
    summary: '谐振子在 (q,p) 相平面上走椭圆，H 守恒。',
    concept: ['相空间', '哈密顿量', '守恒轨道'],
    objectives: ['调振幅看椭圆', '对照 H 恒定', '播放沿轨运动'],
    formulas: ['H=p^2/2m+\\tfrac12 m\\omega^2 q^2'],
    insight: '青椭圆=能级面；金点=当前态。',
    legend: [{ color: '#38bdf8', label: '轨道' }, { color: '#fbbf24', label: '状态' }],
    steps: [{ id: 'orbit', title: '轨道', body: '播放一周观察回到起点附近。', formulas: ['H'], bindings: [{ labelTex: 'H', valueKey: 'H', unit: '' }] }],
    challenges: [{ id: 'big', prompt: '取 q₀≥1.6。', hint: '调振幅。', check: { kind: 'paramNear', key: 'q0', target: 1.8, tol: 0.3 } }],
  },
}

export function registerHamiltonPhaseDemo() {
  registerDemoBundle({
    meta: hamiltonPhaseMeta,
    model: createHamiltonPhaseModel,
    adapter: createHamiltonPhaseAdapter,
  })
}
