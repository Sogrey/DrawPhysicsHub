import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createOscillatorAdapter } from './oscillatorAdapter'

/** Hermite polynomials H0..H5 */
export function hermite(n: number, xi: number): number {
  const nn = Math.max(0, Math.min(5, Math.round(n)))
  if (nn === 0) return 1
  if (nn === 1) return 2 * xi
  let hNm2 = 1
  let hNm1 = 2 * xi
  for (let k = 2; k <= nn; k++) {
    const h = 2 * xi * hNm1 - 2 * (k - 1) * hNm2
    hNm2 = hNm1
    hNm1 = h
  }
  return hNm1
}

export function oscillatorPsi(n: number, omega: number, x: number): number {
  const w = Math.max(0.2, omega)
  const nn = Math.max(0, Math.min(5, Math.round(n)))
  const alpha = Math.sqrt(w) // m=ħ=1 → α=√(mω/ħ)=√ω
  const xi = alpha * x
  let fact = 1
  for (let i = 2; i <= nn; i++) fact *= i
  const norm2 = Math.pow(2, nn)
  const N = Math.sqrt(alpha / (norm2 * fact * Math.sqrt(Math.PI)))
  return N * hermite(nn, xi) * Math.exp(-0.5 * xi * xi)
}

export function oscillatorEnergy(n: number, omega: number): number {
  return Math.max(0.2, omega) * (Math.max(0, Math.round(n)) + 0.5)
}

const NS = 140

export function createOscillatorModel(): PhysicsModel {
  let n = 1
  let omega = 1
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      n = Math.max(0, Math.min(5, Math.round(Number(params.n ?? 1))))
      omega = Number(params.omega ?? 1)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const E = oscillatorEnergy(n, omega)
      const phase = E * t
      const c = Math.cos(phase)
      const span = 4 / Math.sqrt(Math.max(0.2, omega))
      const psi = new Float32Array(NS)
      const dens = new Float32Array(NS)
      const re = new Float32Array(NS)
      const pot = new Float32Array(NS)
      for (let i = 0; i < NS; i++) {
        const x = -span + (2 * span * i) / (NS - 1)
        const amp = oscillatorPsi(n, omega, x)
        psi[i] = amp
        dens[i] = amp * amp
        re[i] = amp * c
        pot[i] = 0.5 * omega * omega * x * x
      }
      return {
        time: t,
        values: {
          n,
          omega,
          E,
          phase,
          phaseDeg: ((phase * 180) / Math.PI) % 360,
          span,
          nSamp: NS,
          psi,
          dens,
          re,
          pot,
          period,
          tMax: period,
          world: span * 0.7 + 1,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.n !== undefined) n = Math.max(0, Math.min(5, Math.round(Number(params.n))))
      if (params.omega !== undefined) omega = Number(params.omega)
    },
  }
}

export const oscillatorMeta: DemoMeta = {
  id: 'qm-oscillator',
  subject: '量子力学',
  category: '束缚态',
  tags: ['谐振子', '能级', 'Hermite'],
  model: 'oscillator',
  adapter: 'oscillator',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    {
      key: 'n',
      label: '量子数 n',
      kind: 'number',
      default: 1,
      min: 0,
      max: 5,
      step: 1,
      unit: '',
    },
    {
      key: 'omega',
      label: '角频率 ω',
      kind: 'number',
      default: 1,
      min: 0.5,
      max: 2,
      step: 0.1,
      unit: '',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'ψₙ' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '位相',
      chartKey: 'phaseDeg',
      charts: [
        {
          id: 'phase',
          title: '位相',
          xLabel: 't (s)',
          leftLabel: 'φ / E',
          series: [
            { key: 'phaseDeg', label: 'φ°', color: '#a78bfa', unit: '°' },
            { key: 'E', label: 'Eₙ', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'n', label: 'n', unit: '', tone: 'purple' },
    { key: 'E', label: 'Eₙ', unit: '', tone: 'amber' },
    { key: 'omega', label: 'ω', unit: '', tone: 'slate' },
    { key: 'phaseDeg', label: 'φ', unit: '°', tone: 'blue' },
  ],
  docs: {
    title: '谐振子本征态',
    summary:
      '一维量子谐振子：Eₙ=ħω(n+1/2)，ψₙ∝Hₙ(ξ)e^{-ξ²/2}。教学 ħ=m=1。播放观察 Reψ 位相振荡。',
    concept: [
      '能级等间距：ΔE=ħω',
      '节点数等于 n；偶/奇宇称交替',
      '经典转折点在 E=½mω²x² 处',
    ],
    objectives: [
      '对照节点数与 n',
      '验证 E=ω(n+1/2)',
      '观察 |ψ|² 不变而 Reψ 振荡',
    ],
    formulas: [
      'E_n=\\hbar\\omega(n+1/2)',
      '\\psi_n\\propto H_n(\\xi)e^{-\\xi^2/2}',
      '\\xi=\\sqrt{m\\omega/\\hbar}\\,x',
    ],
    insight: '灰抛物线为势能；金线=Eₙ；青虚线ψₙ；紫|ψ|²；金实线 Reψ(t)。',
    legend: [
      { color: '#38bdf8', label: 'ψₙ' },
      { color: '#a78bfa', label: '|ψ|²' },
      { color: '#fbbf24', label: 'Reψ / E' },
      { color: '#94a3b8', label: 'V(x)' },
    ],
    steps: [
      {
        id: 'energy',
        title: '能级',
        body: 'Eₙ=ω(n+½)（ħ=1）。',
        formulas: ['E_n=\\omega(n+1/2)'],
        bindings: [
          { labelTex: 'n', valueKey: 'n', unit: '' },
          { labelTex: '\\omega', valueKey: 'omega', unit: '' },
          { labelTex: 'E_n', valueKey: 'E', unit: '' },
        ],
      },
      {
        id: 'nodes',
        title: '节点',
        body: '切换 n，数曲线与横轴交点（不含无穷远）。',
        formulas: ['N_{\\mathrm{nodes}}=n'],
        bindings: [{ labelTex: 'n', valueKey: 'n', unit: '' }],
      },
    ],
    challenges: [
      {
        id: 'e1',
        prompt: '取 n=1、ω=1，使 E=1.5。',
        hint: 'E=ω(n+1/2)。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'n', target: 1, tol: 0.2 },
            { kind: 'paramNear', key: 'omega', target: 1, tol: 0.15 },
            { kind: 'valueNear', key: 'E', target: 1.5, tol: 0.08 },
          ],
        },
      },
    ],
  },
}

export function registerOscillatorDemo(): void {
  registerDemoBundle({
    meta: oscillatorMeta,
    model: createOscillatorModel,
    adapter: createOscillatorAdapter,
  })
}
