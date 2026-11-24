import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createEulerAnglesAdapter } from './eulerAnglesAdapter'

/** ZXZ 欧拉：合成绕体轴示意角速率量纲无关 */
export function eulerCompose(phi: number, theta: number, psi: number) {
  return { phi, theta, psi, tipX: Math.sin(theta) * Math.cos(phi), tipY: Math.cos(theta), tipZ: Math.sin(theta) * Math.sin(phi) }
}

export function createEulerAnglesModel(): PhysicsModel {
  let theta0 = 0.6
  let t = 0
  const period = 10

  return {
    init(p: ParamValues) {
      theta0 = Number(p.theta0 ?? 0.6)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const phi = (2 * Math.PI * t) / period
      const psi = (4 * Math.PI * t) / period
      const theta = theta0
      const e = eulerCompose(phi, theta, psi)
      return {
        time: t,
        values: {
          phi,
          theta,
          psi,
          theta0,
          tipX: e.tipX,
          tipY: e.tipY,
          tipZ: e.tipZ,
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
      if (p.theta0 !== undefined) theta0 = Number(p.theta0)
    },
  }
}

export const eulerAnglesMeta: DemoMeta = {
  id: 'theo-euler-angles',
  subject: '理论力学',
  category: '刚体动力学',
  tags: ['欧拉角', '姿态'],
  model: 'eulerAngles',
  adapter: 'eulerAngles',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [{ key: 'theta0', label: '章动角 θ', kind: 'number', default: 0.6, min: 0.2, max: 1.2, step: 0.05, unit: 'rad' }],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '欧拉角' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'φ',
      chartKey: 'phi',
      charts: [{ id: 'a', title: '欧拉角', xLabel: 't', leftLabel: 'rad', series: [{ key: 'phi', label: 'φ', color: '#38bdf8', unit: '' }, { key: 'psi', label: 'ψ', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'phi', label: 'φ', unit: '', tone: 'blue' },
    { key: 'theta', label: 'θ', unit: '', tone: 'slate' },
    { key: 'psi', label: 'ψ', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '欧拉角与刚体姿态',
    summary: 'ZXZ 欧拉角 (φ,θ,ψ)：进动、章动、自转。播放转动体轴尖迹。',
    concept: ['进动', '章动', '自转'],
    objectives: ['调 θ', '播放看 φ、ψ', '观察轴尖'],
    formulas: ['R=R_z(\\phi)R_x(\\theta)R_z(\\psi)'],
    insight: '金=体轴；青/金曲线=φ/ψ。',
    legend: [{ color: '#fbbf24', label: '体轴' }],
    steps: [{ id: 'nut', title: '章动', body: '改变 θ 看锥张角。', formulas: ['\\theta'], bindings: [{ labelTex: '\\theta', valueKey: 'theta', unit: '' }] }],
    challenges: [{ id: 'wide', prompt: '取 θ≥1.0。', hint: '调章动角。', check: { kind: 'paramNear', key: 'theta0', target: 1.1, tol: 0.2 } }],
  },
}

export function registerEulerAnglesDemo() {
  registerDemoBundle({ meta: eulerAnglesMeta, model: createEulerAnglesModel, adapter: createEulerAnglesAdapter })
}
