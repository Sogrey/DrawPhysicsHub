import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createBirefringenceSnellAdapter } from './birefringenceSnellAdapter'

/**
 * 双折射斯涅耳作图加深：空气→单轴晶体
 *   sin θᵢ = n_o sin θ_o = n_e sin θ_e（教学近似，e 光用有效折射率）
 * 作图强调：同一入射，两条折射线；n_e≠n_o ⇒ 角分离。
 */
export function snellOE(
  thetaIDeg: number,
  nO: number,
  nE: number,
): { thetaI: number; thetaO: number; thetaE: number; dTheta: number } {
  const thetaI = Math.max(0, Math.min(70, thetaIDeg))
  const sI = Math.sin((thetaI * Math.PI) / 180)
  const sO = Math.min(0.999, sI / Math.max(1.01, nO))
  const sE = Math.min(0.999, sI / Math.max(1.01, nE))
  const thetaO = (Math.asin(sO) * 180) / Math.PI
  const thetaE = (Math.asin(sE) * 180) / Math.PI
  return { thetaI, thetaO, thetaE, dTheta: thetaE - thetaO }
}

export function createBirefringenceSnellModel(): PhysicsModel {
  let nO = 1.66
  let nE = 1.49
  let thetaMax = 55
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      nO = Number(params.nO ?? 1.66)
      nE = Number(params.nE ?? 1.49)
      thetaMax = Number(params.thetaMax ?? 55)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const thetaI = (thetaMax * t) / period
      const s = snellOE(thetaI, nO, nE)
      return {
        time: t,
        values: {
          nO,
          nE,
          thetaMax,
          thetaI: s.thetaI,
          thetaO: s.thetaO,
          thetaE: s.thetaE,
          dTheta: s.dTheta,
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
      if (params.nO !== undefined) nO = Number(params.nO)
      if (params.nE !== undefined) nE = Number(params.nE)
      if (params.thetaMax !== undefined) thetaMax = Number(params.thetaMax)
    },
  }
}

export const birefringenceSnellMeta: DemoMeta = {
  id: 'opt-birefringence-snell',
  subject: '光学',
  category: '偏振',
  tags: ['双折射', '斯涅耳', 'o/e光'],
  model: 'birefringenceSnell',
  adapter: 'birefringenceSnell',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'nO', label: 'n_o', kind: 'number', default: 1.66, min: 1.2, max: 1.9, step: 0.02, unit: '' },
    { key: 'nE', label: 'n_e', kind: 'number', default: 1.49, min: 1.2, max: 1.9, step: 0.02, unit: '' },
    { key: 'thetaMax', label: 'θᵢ 扫幅', kind: 'number', default: 55, min: 20, max: 70, step: 5, unit: '°' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '斯涅耳作图' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '角',
      chartKey: 'dTheta',
      charts: [
        {
          id: 'ang',
          title: '折射角',
          xLabel: 't (s)',
          leftLabel: '°',
          series: [
            { key: 'thetaO', label: 'θ_o', color: '#38bdf8', unit: '°' },
            { key: 'thetaE', label: 'θ_e', color: '#f472b6', unit: '°' },
            { key: 'dTheta', label: 'Δθ', color: '#fbbf24', unit: '°' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'thetaI', label: 'θᵢ', unit: '°', tone: 'amber' },
    { key: 'thetaO', label: 'θ_o', unit: '°', tone: 'blue' },
    { key: 'thetaE', label: 'θ_e', unit: '°', tone: 'pink' },
  ],
  docs: {
    title: '双折射斯涅耳作图（加深）',
    summary:
      '同一入射角，o/e 光分别按 n_o、n_e 作斯涅耳折射。负单轴（n_e<n_o）时 e 光偏折更大。对照已有「双折射板」演示的横向分离。',
    concept: [
      'sin θᵢ = n_o sin θ_o = n_e sin θ_e（近似）',
      '两折射角不同 → 双像',
      '作图：法线、入射、θ_o、θ_e',
    ],
    objectives: ['完成 o/e 双折射角作图', '观察 Δθ 随 θᵢ 增大', '对比 n_o、n_e'],
    formulas: ['\\sin\\theta_i=n_o\\sin\\theta_o', '\\sin\\theta_i=n_e\\sin\\theta_e'],
    insight: '青=o 光，粉=e 光；虚线=法线。播放扫入射角。',
    legend: [
      { color: '#4ade80', label: '入射' },
      { color: '#38bdf8', label: 'o 光' },
      { color: '#f472b6', label: 'e 光' },
    ],
    steps: [
      {
        id: 'sep',
        title: '角分离',
        body: '增大 θᵢ，看 |θ_e−θ_o|。',
        formulas: ['\\Delta\\theta=\\theta_e-\\theta_o'],
        bindings: [
          { labelTex: '\\Delta\\theta', valueKey: 'dTheta', unit: '°' },
          { labelTex: '\\theta_i', valueKey: 'thetaI', unit: '°' },
        ],
      },
    ],
    challenges: [
      {
        id: 'split',
        prompt: '播放使 |Δθ|>3°。',
        hint: '用默认方解石型参数，扫到中后段。',
        check: { kind: 'valueNear', key: 'dTheta', target: 5, tol: 4 },
      },
    ],
  },
}

export function registerBirefringenceSnellDemo(): void {
  registerDemoBundle({
    meta: birefringenceSnellMeta,
    model: createBirefringenceSnellModel,
    adapter: createBirefringenceSnellAdapter,
  })
}
