import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createBohrAdapter } from './bohrAdapter'

/** 玻尔能级 E_n = −13.6 / n² eV */
export function bohrEnergy(n: number): number {
  const nn = Math.max(1, Math.round(n))
  return -13.6 / (nn * nn)
}

/** 轨道半径（以 a₀ 为单位）r_n = n² */
export function bohrRadius(n: number): number {
  const nn = Math.max(1, Math.round(n))
  return nn * nn
}

/**
 * 跃迁光子能量 |E_i − E_f|（eV）；ni>nf 发射。
 */
export function transitionEnergyEv(ni: number, nf: number): number {
  return Math.abs(bohrEnergy(ni) - bohrEnergy(nf))
}

/** 里德伯示意：λ ∝ 1/(1/nf² − 1/ni²)，返回相对波长（教学单位） */
export function spectralLambda(ni: number, nf: number): number {
  const a = 1 / (nf * nf) - 1 / (ni * ni)
  if (a <= 1e-9) return 0
  return 1 / a
}

export function createBohrModel(): PhysicsModel {
  let ni = 3
  let nf = 2
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      ni = Math.round(Number(p.ni ?? 3))
      nf = Math.round(Number(p.nf ?? 2))
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const nHi = Math.min(5, Math.max(2, Math.max(ni, nf + 1)))
      const nLo = Math.min(nHi - 1, Math.max(1, Math.min(ni, nf)))
      const Ei = bohrEnergy(nHi)
      const Ef = bohrEnergy(nLo)
      const dE = transitionEnergyEv(nHi, nLo)
      const lam = spectralLambda(nHi, nLo)
      const u = t / period
      // 前半在高轨旋转，后半跃迁到低轨
      const nNow = u < 0.55 ? nHi : nLo
      const r = bohrRadius(nNow) * 0.35
      const ang = 2 * Math.PI * (u < 0.55 ? u / 0.55 : (u - 0.55) / 0.45) * (nNow === nHi ? 1 : 1.4)
      const flash = u >= 0.55 && u < 0.7 ? 1 : 0
      const levels: number[][] = []
      for (let n = 1; n <= 5; n++) levels.push([n, bohrEnergy(n)])
      return {
        time: t,
        values: {
          ni: nHi,
          nf: nLo,
          Ei,
          Ef,
          dE,
          lam,
          nNow,
          r,
          ang,
          flash,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { levels },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.ni !== undefined) ni = Math.round(Number(p.ni))
      if (p.nf !== undefined) nf = Math.round(Number(p.nf))
    },
  }
}

export const bohrMeta: DemoMeta = {
  id: 'atom-bohr',
  subject: '近代物理',
  category: '原子光谱',
  tags: ['玻尔', '能级', '光谱'],
  model: 'bohr',
  adapter: 'bohr',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'ni', label: '初态 nᵢ', kind: 'number', default: 3, min: 2, max: 5, step: 1, unit: '' },
    { key: 'nf', label: '末态 n_f', kind: 'number', default: 2, min: 1, max: 4, step: 1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '轨道/能级' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'ΔE',
      chartKey: 'dE',
      charts: [
        {
          id: 'e',
          title: '跃迁能量',
          xLabel: 't',
          leftLabel: 'E (eV)',
          series: [
            { key: 'dE', label: 'ΔE', color: '#fbbf24', unit: 'eV' },
            { key: 'lam', label: 'λ∝', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'ni', label: 'nᵢ', unit: '', tone: 'slate' },
    { key: 'nf', label: 'n_f', unit: '', tone: 'blue' },
    { key: 'dE', label: 'ΔE', unit: 'eV', tone: 'amber' },
    { key: 'lam', label: 'λ∝', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '玻尔轨道与光谱线',
    summary: '氢原子 E_n=−13.6/n² eV，r_n=n² a₀。跃迁 nᵢ→n_f 发射光子 ΔE=|Eᵢ−E_f|。',
    concept: ['量子化轨道', '能级', '光谱线'],
    objectives: ['切换 nᵢ/n_f', '对照能级差', '播放看跃迁闪光'],
    formulas: ['E_n=-13.6/n^2\\ \\mathrm{eV}', 'r_n=n^2 a_0', '\\Delta E=|E_i-E_f|'],
    insight: '左=玻尔轨道；右=能级阶梯；播放先绕高轨再跃迁。',
    legend: [
      { color: '#38bdf8', label: '轨道' },
      { color: '#fbbf24', label: '电子' },
      { color: '#f472b6', label: '光子' },
    ],
    steps: [
      {
        id: 'balmer',
        title: '巴耳末线',
        body: '取 nᵢ=3、n_f=2 看可见区跃迁。',
        formulas: ['\\Delta E'],
        bindings: [
          { labelTex: '\\Delta E', valueKey: 'dE', unit: 'eV' },
          { labelTex: 'n_i', valueKey: 'ni', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'lyman',
        prompt: '取末态 n_f=1（莱曼系）。',
        hint: '调末态滑条。',
        check: { kind: 'paramNear', key: 'nf', target: 1, tol: 0.5 },
      },
    ],
  },
}

export function registerBohrDemo() {
  registerDemoBundle({ meta: bohrMeta, model: createBohrModel, adapter: createBohrAdapter })
}
