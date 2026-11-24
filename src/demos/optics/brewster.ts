import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createBrewsterAdapter } from './brewsterAdapter'

/** 布儒斯特角 θ_B = arctan(n₂/n₁)；p 偏振反射≈0 */
export function brewsterAngle(n1: number, n2: number): number {
  return (Math.atan(n2 / Math.max(1e-9, n1)) * 180) / Math.PI
}

/** 教学简化：Rs 随角单调升；Rp 在 θ_B 近零 */
export function fresnelRP(thetaDeg: number, n1: number, n2: number): { Rs: number; Rp: number; pol: number } {
  const thetaB = brewsterAngle(n1, n2)
  const th = Math.max(0, Math.min(89, thetaDeg))
  const x = th / 90
  const Rs = Math.min(0.95, 0.02 + 0.9 * x * x)
  const dist = Math.abs(th - thetaB) / 45
  const Rp = Math.min(0.95, 0.02 + 0.85 * dist * dist)
  const pol = Rs > 1e-6 ? (Rs - Rp) / (Rs + Rp) : 0
  return { Rs, Rp, pol }
}

export function createBrewsterModel(): PhysicsModel {
  let n1 = 1
  let n2 = 1.5
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      n1 = Number(params.n1 ?? 1)
      n2 = Number(params.n2 ?? 1.5)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const thetaB = brewsterAngle(n1, n2)
      const theta = (85 * t) / period
      const f = fresnelRP(theta, n1, n2)
      const nearB = Math.abs(theta - thetaB) < 3 ? 1 : 0
      return {
        time: t,
        values: {
          n1,
          n2,
          thetaB,
          theta,
          Rs: f.Rs,
          Rp: f.Rp,
          pol: f.pol,
          nearB,
          period,
          tMax: period,
          world: 5,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.n1 !== undefined) n1 = Number(params.n1)
      if (params.n2 !== undefined) n2 = Number(params.n2)
    },
  }
}

export const brewsterMeta: DemoMeta = {
  id: 'opt-brewster',
  subject: '光学',
  category: '偏振',
  tags: ['布儒斯特', '偏振'],
  model: 'brewster',
  adapter: 'brewster',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'n1', label: 'n₁', kind: 'number', default: 1, min: 1, max: 1.5, step: 0.05, unit: '' },
    { key: 'n2', label: 'n₂', kind: 'number', default: 1.5, min: 1.2, max: 2.2, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '反射' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'R',
      chartKey: 'Rp',
      charts: [
        {
          id: 'r',
          title: '反射率',
          xLabel: 't (s)',
          leftLabel: 'R',
          series: [
            { key: 'Rs', label: 'R_s', color: '#38bdf8', unit: '' },
            { key: 'Rp', label: 'R_p', color: '#f472b6', unit: '' },
            { key: 'pol', label: '偏振度', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'theta', label: 'θᵢ', unit: '°', tone: 'amber' },
    { key: 'thetaB', label: 'θ_B', unit: '°', tone: 'purple' },
    { key: 'Rp', label: 'R_p', unit: '', tone: 'pink' },
  ],
  docs: {
    title: '布儒斯特角与起偏',
    summary:
      'θ_B=arctan(n₂/n₁) 时 p 偏振反射接近零，反射光以 s 偏振为主 → 起偏。播放扫入射角，观察 R_p 谷与偏振度峰。',
    concept: [
      'θ_B = arctan(n₂/n₁)',
      '布儒斯特角处 R_p≈0',
      '反射光可作部分起偏',
    ],
    objectives: ['读出 θ_B', '观察 R_p 极小', '理解反射起偏'],
    formulas: ['\\theta_B=\\arctan(n_2/n_1)', 'R_p(\\theta_B)\\approx 0'],
    insight: '虚线标 θ_B；粉=R_p，青=R_s。过布儒斯特角时粉箭头几乎消失。',
    legend: [
      { color: '#4ade80', label: '入射' },
      { color: '#38bdf8', label: 's 反射' },
      { color: '#f472b6', label: 'p 反射' },
    ],
    steps: [
      {
        id: 'valley',
        title: '谷点',
        body: '拖到 θ≈θ_B，看 R_p 最小。',
        formulas: ['\\theta\\approx\\theta_B'],
        bindings: [
          { labelTex: '\\theta_B', valueKey: 'thetaB', unit: '°' },
          { labelTex: 'R_p', valueKey: 'Rp', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'atB',
        prompt: '使入射角接近 θ_B（|θ−θ_B|<5°）。',
        hint: '玻璃 n₂=1.5 时 θ_B≈56°。',
        check: { kind: 'valueNear', key: 'nearB', target: 1, tol: 0.5 },
      },
    ],
  },
}

export function registerBrewsterDemo(): void {
  registerDemoBundle({
    meta: brewsterMeta,
    model: createBrewsterModel,
    adapter: createBrewsterAdapter,
  })
}
