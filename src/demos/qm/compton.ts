import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createComptonAdapter } from './comptonAdapter'

/** 教学：λ'−λ = λc(1−cosθ)，λc=1 */
export function comptonShift(thetaDeg: number, lambdaC = 1): number {
  const th = (Math.max(0, Math.min(180, thetaDeg)) * Math.PI) / 180
  return lambdaC * (1 - Math.cos(th))
}

export function createComptonModel(): PhysicsModel {
  let theta = 60
  let lambda = 2
  let t = 0
  const period = 6
  const lambdaC = 1

  return {
    init(params: ParamValues) {
      theta = Number(params.theta ?? 60)
      lambda = Number(params.lambda ?? 2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const dLambda = comptonShift(theta, lambdaC)
      const lambdaP = lambda + dLambda
      const th = (theta * Math.PI) / 180
      const u = t / period
      return {
        time: t,
        values: {
          theta,
          lambda,
          lambdaC,
          dLambda,
          lambdaP,
          th,
          u,
          period,
          tMax: period,
          world: 4,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.theta !== undefined) theta = Number(params.theta)
      if (params.lambda !== undefined) lambda = Number(params.lambda)
    },
  }
}

export const comptonMeta: DemoMeta = {
  id: 'qm-compton',
  subject: '量子力学',
  category: '近代实验',
  tags: ['康普顿', '散射', '波长'],
  model: 'compton',
  adapter: 'compton',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'theta', label: '散射角 θ', kind: 'number', default: 60, min: 0, max: 180, step: 5, unit: '°' },
    { key: 'lambda', label: '入射 λ', kind: 'number', default: 2, min: 0.8, max: 4, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '散射' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'Δλ',
      chartKey: 'dLambda',
      charts: [
        {
          id: 'shift',
          title: '波长偏移',
          xLabel: 't (s)',
          leftLabel: 'Δλ',
          series: [{ key: 'dLambda', label: 'Δλ', color: '#f472b6', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'theta', label: 'θ', unit: '°', tone: 'slate' },
    { key: 'lambda', label: 'λ', unit: '', tone: 'blue' },
    { key: 'lambdaP', label: "λ'", unit: '', tone: 'amber' },
    { key: 'dLambda', label: 'Δλ', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '康普顿散射几何',
    summary: '光子-电子弹性散射：Δλ=λc(1−cosθ)。教学 λc=1。播放展示入射/散射光子与反冲电子方向。',
    concept: [
      '散射后光子波长变长',
      '偏移只依赖散射角，与入射强度无关',
      '支持光的粒子性',
    ],
    objectives: ['验证 Δλ=λc(1−cosθ)', '观察 θ=180° 时偏移最大', '读出 λ′=λ+Δλ'],
    formulas: ["\\Delta\\lambda=\\lambda_c(1-\\cos\\theta)", "\\lambda'=\\lambda+\\Delta\\lambda", '\\lambda_c=1'],
    insight: '播放三阶段：入射→碰撞失能→散射(λ↑)+反冲。粉箭头长度∝电子动能∝Δλ；右下对比尺解释为何波长变长。',
    legend: [
      { color: '#38bdf8', label: '入射光子' },
      { color: '#fbbf24', label: '散射光子' },
      { color: '#f472b6', label: '电子' },
    ],
    steps: [
      {
        id: 'shift',
        title: '波长偏移',
        body: '改变 θ，读 Δλ。',
        formulas: ['\\Delta\\lambda=\\lambda_c(1-\\cos\\theta)'],
        bindings: [
          { labelTex: '\\theta', valueKey: 'theta', unit: '°' },
          { labelTex: '\\Delta\\lambda', valueKey: 'dLambda', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'backscatter',
        prompt: '取 θ=180°，使 Δλ≈2。',
        hint: '1−cos180°=2。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'theta', target: 180, tol: 8 },
            { kind: 'valueNear', key: 'dLambda', target: 2, tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerComptonDemo(): void {
  registerDemoBundle({
    meta: comptonMeta,
    model: createComptonModel,
    adapter: createComptonAdapter,
  })
}
