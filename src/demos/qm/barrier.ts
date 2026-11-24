import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createBarrierAdapter } from './barrierAdapter'

/** ħ=m=1 矩形势垒透射系数（E≠V0） */
export function barrierTransmission(E: number, V0: number, a: number): number {
  const EE = Math.max(0.05, E)
  const VV = Math.max(0.05, V0)
  const aa = Math.max(0.1, a)
  if (Math.abs(EE - VV) < 1e-6) {
    return 1 / (1 + (VV * aa * aa) / 2)
  }
  if (EE > VV) {
    const q = Math.sqrt(2 * (EE - VV))
    const denom =
      1 + (VV * VV * Math.sin(q * aa) ** 2) / (4 * EE * (EE - VV))
    return 1 / denom
  }
  const kappa = Math.sqrt(2 * (VV - EE))
  const sinh = Math.sinh(kappa * aa)
  const denom = 1 + (VV * VV * sinh * sinh) / (4 * EE * (VV - EE))
  return 1 / denom
}

const NS = 160

/**
 * 势垒隧道：显示入射/垒内/透射示意波与 T(E)。
 */
export function createBarrierModel(): PhysicsModel {
  let E = 1.2
  let V0 = 2
  let a = 1.2
  let t = 0
  const period = 8
  const xMin = -4
  const xMax = 4

  return {
    init(params: ParamValues) {
      E = Number(params.E ?? 1.2)
      V0 = Number(params.V0 ?? 2)
      a = Number(params.a ?? 1.2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const T = barrierTransmission(E, V0, a)
      const R = Math.max(0, 1 - T)
      const k = Math.sqrt(2 * Math.max(0.05, E))
      const phase = k * 0.35 * t
      const psi = new Float32Array(NS)
      const dens = new Float32Array(NS)
      const pot = new Float32Array(NS)
      for (let i = 0; i < NS; i++) {
        const x = xMin + ((xMax - xMin) * i) / (NS - 1)
        pot[i] = x >= 0 && x <= a ? V0 : 0
        let amp = 0
        if (x < 0) {
          amp = Math.sin(k * x - phase) + Math.sqrt(R) * Math.sin(-k * x - phase)
          amp *= 0.45
        } else if (x <= a) {
          if (E < V0) {
            const kappa = Math.sqrt(2 * (V0 - E))
            amp = 0.55 * Math.exp(-kappa * x) * Math.cos(phase * 0.5)
          } else {
            const q = Math.sqrt(2 * (E - V0))
            amp = 0.45 * Math.sin(q * x - phase)
          }
        } else {
          amp = Math.sqrt(T) * 0.55 * Math.sin(k * (x - a) - phase)
        }
        psi[i] = amp
        dens[i] = amp * amp
      }
      // T(E) curve samples
      const nCurve = 80
      const curveE = new Float32Array(nCurve)
      const curveT = new Float32Array(nCurve)
      const eMax = Math.max(V0 * 1.8, E * 1.5, 3)
      for (let i = 0; i < nCurve; i++) {
        const e = 0.05 + (eMax * i) / (nCurve - 1)
        curveE[i] = e
        curveT[i] = barrierTransmission(e, V0, a)
      }
      return {
        time: t,
        values: {
          E,
          V0,
          a,
          T,
          R,
          phase,
          nSamp: NS,
          xMin,
          xMax,
          psi,
          dens,
          pot,
          curveE,
          curveT,
          nCurve,
          eMax,
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
      if (params.E !== undefined) E = Number(params.E)
      if (params.V0 !== undefined) V0 = Number(params.V0)
      if (params.a !== undefined) a = Number(params.a)
    },
  }
}

export const barrierMeta: DemoMeta = {
  id: 'qm-barrier',
  subject: '量子力学',
  category: '散射与隧道',
  tags: ['隧道', '势垒', '透射'],
  model: 'barrier',
  adapter: 'barrier',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    {
      key: 'E',
      label: '能量 E',
      kind: 'number',
      default: 1.2,
      min: 0.3,
      max: 4,
      step: 0.1,
      unit: '',
    },
    {
      key: 'V0',
      label: '垒高 V₀',
      kind: 'number',
      default: 2,
      min: 0.5,
      max: 5,
      step: 0.1,
      unit: '',
    },
    {
      key: 'a',
      label: '垒宽 a',
      kind: 'number',
      default: 1.2,
      min: 0.4,
      max: 2.5,
      step: 0.1,
      unit: '',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '势垒' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'T(E)',
      chartKey: 'T',
      charts: [
        {
          id: 'TE',
          title: '透射',
          xLabel: 't (s)',
          leftLabel: 'T',
          series: [{ key: 'T', label: 'T', color: '#4ade80', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'E', label: 'E', unit: '', tone: 'amber' },
    { key: 'V0', label: 'V₀', unit: '', tone: 'slate' },
    { key: 'T', label: 'T', unit: '', tone: 'green' },
    { key: 'R', label: 'R', unit: '', tone: 'purple' },
    { key: 'a', label: 'a', unit: '', tone: 'blue' },
  ],
  docs: {
    title: '势垒隧道概率流',
    summary:
      '矩形势垒：E<V₀ 仍有透射 T>0（隧道效应）。调节 E、V₀、a，观察 T 与垒内指数衰减示意。',
    concept: [
      '经典禁区 E<V₀ 中波函数指数衰减，但仍可透射',
      '垒越厚 / 越高，隧道概率越小',
      'E>V₀ 时出现共振式振荡的 T(E)',
    ],
    objectives: [
      '区分 E<V₀ 与 E>V₀ 的透射行为',
      '观察 a 增大导致 T 下降',
      '对照 T+R≈1',
    ],
    formulas: [
      'T(E,V_0,a)\\quad(\\hbar=m=1)',
      'E<V_0:\\;\\kappa=\\sqrt{2(V_0-E)}',
      'R+T=1',
    ],
    insight: '青线为示意波；灰块为势垒；金线为能量 E。右侧小图为 T(E) 曲线，粉点为当前 E。',
    legend: [
      { color: '#38bdf8', label: 'ψ 示意' },
      { color: '#94a3b8', label: '势垒 V₀' },
      { color: '#fbbf24', label: '能量 E' },
      { color: '#4ade80', label: 'T(E)' },
    ],
    steps: [
      {
        id: 'tunnel',
        title: '隧道',
        body: '取 E<V₀，仍可读到非零 T。',
        formulas: ['T>0\\ (E<V_0)'],
        bindings: [
          { labelTex: 'E', valueKey: 'E', unit: '' },
          { labelTex: 'V_0', valueKey: 'V0', unit: '' },
          { labelTex: 'T', valueKey: 'T', unit: '' },
        ],
      },
      {
        id: 'width',
        title: '垒宽',
        body: '增大 a，T 迅速变小。',
        formulas: ['T\\downarrow\\ \\mathrm{as}\\ a\\uparrow'],
        bindings: [
          { labelTex: 'a', valueKey: 'a', unit: '' },
          { labelTex: 'T', valueKey: 'T', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'tunnel-nonzero',
        prompt: '取 E=1.2、V₀=2，使 T>0.01。',
        hint: '默认参数即满足。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'E', target: 1.2, tol: 0.2 },
            { kind: 'paramNear', key: 'V0', target: 2, tol: 0.3 },
            { kind: 'valueNear', key: 'T', target: 0.15, tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerBarrierDemo(): void {
  registerDemoBundle({
    meta: barrierMeta,
    model: createBarrierModel,
    adapter: createBarrierAdapter,
  })
}
