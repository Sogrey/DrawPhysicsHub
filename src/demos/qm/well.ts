import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createWellAdapter } from './wellAdapter'

/**
 * 一维无限深势阱（0≤x≤L）：
 *   ψ_n(x) = √(2/L) sin(nπx/L)
 *   E_n = (n² π² ħ²)/(2 m L²)
 * 教学取 ħ=1、m=1 → E_n = n² π² /(2 L²)
 * 播放：展示时间因子 e^{-i E t/ħ} 下 |ψ|² 不变，Re ψ 振荡；可切换 n。
 */
export function wellPsi(n: number, L: number, x: number): number {
  const nn = Math.max(1, Math.round(n))
  const LL = Math.max(0.5, L)
  if (x <= 0 || x >= LL) return 0
  return Math.sqrt(2 / LL) * Math.sin((nn * Math.PI * x) / LL)
}

export function wellEnergy(n: number, L: number): number {
  const nn = Math.max(1, Math.round(n))
  const LL = Math.max(0.5, L)
  return (nn * nn * Math.PI * Math.PI) / (2 * LL * LL)
}

export function createWellModel(): PhysicsModel {
  let n = 1
  let L = 4
  let t = 0
  const period = 8
  const Nsamp = 120

  return {
    init(params: ParamValues) {
      n = Math.max(1, Math.round(Number(params.n ?? 1)))
      L = Number(params.L ?? 4)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const E = wellEnergy(n, L)
      const omega = E // ħ=1
      const phase = omega * t
      const psi = new Float32Array(Nsamp)
      const dens = new Float32Array(Nsamp)
      const re = new Float32Array(Nsamp)
      const im = new Float32Array(Nsamp)
      // ψ(x,t)=ψₙ(x) e^{-iEt/ħ} → Re=ψ cosφ, Im=−ψ sinφ
      const c = Math.cos(phase)
      const s = Math.sin(phase)
      for (let i = 0; i < Nsamp; i++) {
        const x = (L * i) / (Nsamp - 1)
        const amp = wellPsi(n, L, x)
        psi[i] = amp
        dens[i] = amp * amp
        re[i] = amp * c
        im[i] = -amp * s
      }
      // 期望位置（对称 → L/2）
      const xExpect = L / 2
      return {
        time: t,
        values: {
          n,
          L,
          E,
          phase,
          phaseDeg: ((phase * 180) / Math.PI) % 360,
          xExpect,
          nSamp: Nsamp,
          psi,
          dens,
          re,
          im,
          period,
          tMax: period,
          world: L * 0.7 + 1.5,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.n !== undefined) n = Math.max(1, Math.round(Number(params.n)))
      if (params.L !== undefined) L = Number(params.L)
    },
  }
}

export const wellMeta: DemoMeta = {
  id: 'qm-well',
  subject: '量子力学',
  category: '束缚态',
  tags: ['波函数', '能级', '势阱'],
  model: 'well',
  adapter: 'well',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'n',
      label: '量子数 n',
      kind: 'number',
      default: 1,
      min: 1,
      max: 5,
      step: 1,
      unit: '',
    },
    {
      key: 'L',
      label: '阱宽 L',
      kind: 'number',
      default: 4,
      min: 2.5,
      max: 6,
      step: 0.25,
      unit: '',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '波函数' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'E',
      charts: [
        {
          id: 'phase',
          title: '位相',
          xLabel: 't (s)',
          leftLabel: 'φ',
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
    { key: 'L', label: 'L', unit: '', tone: 'slate' },
    { key: 'phaseDeg', label: 'φ', unit: '°', tone: 'blue' },
  ],
  docs: {
    title: '一维无限深势阱',
    summary:
      '0≤x≤L 无限深阱：ψₙ=√(2/L) sin(nπx/L)，Eₙ=n²π²ħ²/(2mL²)。教学 ħ=m=1。|ψ|² 不随时间变；Re ψ 以 E/ħ 振荡。',
    concept: [
      '边界条件 ψ(0)=ψ(L)=0 导致分立能级。',
      '节点数 = n−1；n 越大波长越短、能量越高。',
      '定态 |ψ|² 稳定；时间只进入整体位相。',
    ],
    objectives: [
      '对照 ψ 曲线节点数与 n',
      '验证 E∝n²、∝1/L²',
      '观察 |ψ|² 不变而 Re ψ 振荡',
    ],
    formulas: [
      '\\psi_n=\\sqrt{2/L}\\sin(n\\pi x/L)',
      'E_n=n^2\\pi^2\\hbar^2/(2mL^2)',
      '\\hbar=m=1\\Rightarrow E_n=n^2\\pi^2/(2L^2)',
    ],
    insight:
      '2D：青虚线ψₙ、紫|ψ|²、金Reψ(t)；顶栏钟=φ。3D：金线为(x,Re,Im)复曲线随φ转动，|ψ|²在侧立剖面，青虚线为ψₙ包络。',
    legend: [
      { color: '#38bdf8', label: 'ψₙ 包络（虚线）' },
      { color: '#a78bfa', label: '|ψ|² 概率密度' },
      { color: '#fbbf24', label: 'Reψ(t) / 复曲线' },
      { color: '#34d399', label: 'Im 轴（3D）' },
      { color: '#94a3b8', label: '势阱壁 V=∞' },
    ],
    steps: [
      {
        id: 'psi',
        title: '波函数',
        body: '驻波形式，边界为零。',
        formulas: ['\\psi_n=\\sqrt{2/L}\\sin(n\\pi x/L)'],
        bindings: [
          { labelTex: 'n', valueKey: 'n', unit: '' },
          { labelTex: 'L', valueKey: 'L', unit: '' },
        ],
      },
      {
        id: 'energy',
        title: '能级',
        body: 'Eₙ ∝ n² / L²。',
        formulas: ['E_n=n^2\\pi^2/(2L^2)'],
        bindings: [{ labelTex: 'E_n', valueKey: 'E', unit: '' }],
      },
      {
        id: 'time',
        title: '时间演化',
        body: '定态只差位相因子；|ψ|² 不变。',
        formulas: ['\\psi(x,t)=\\psi_n(x)e^{-iEt/\\hbar}'],
        bindings: [{ labelTex: '\\varphi', valueKey: 'phaseDeg', unit: '°' }],
        highlightOn: 'scrub',
      },
    ],
    challenges: [
      {
        id: 'n2-nodes',
        prompt: '取 n=2，波函数应有 1 个节点（中点附近为零）。',
        hint: '节点数 = n−1。',
        check: {
          kind: 'all',
          checks: [{ kind: 'paramNear', key: 'n', target: 2, tol: 0.2 }],
        },
      },
      {
        id: 'energy-scale',
        prompt: '取 n=1、L=4，使 E₁≈π²/(2×16)≈0.308。',
        hint: 'E=n²π²/(2L²)。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'n', target: 1, tol: 0.2 },
            { kind: 'paramNear', key: 'L', target: 4, tol: 0.2 },
            { kind: 'valueNear', key: 'E', target: 0.308, tol: 0.05 },
          ],
        },
      },
    ],
  },
}

export function registerWellDemo(): void {
  registerDemoBundle({
    meta: wellMeta,
    model: createWellModel,
    adapter: createWellAdapter,
  })
}
