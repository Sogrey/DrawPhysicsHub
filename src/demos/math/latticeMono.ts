import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createLatticeMonoAdapter } from './latticeMonoAdapter'

/** 单原子链：ω = 2√(κ/m) |sin(ka/2)| */
export function monoDispersion(k: number, a: number, kappa: number, mass: number): number {
  const w0 = 2 * Math.sqrt(kappa / Math.max(1e-6, mass))
  return w0 * Math.abs(Math.sin((k * a) / 2))
}

export function createLatticeMonoModel(): PhysicsModel {
  let kappa = 1
  let mass = 1
  let a = 1
  let t = 0
  const period = 8
  const N_ATOMS = 16

  return {
    init(params: ParamValues) {
      kappa = Number(params.kappa ?? 1)
      mass = Number(params.mass ?? 1)
      a = Number(params.a ?? 1)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const kMax = Math.PI / a
      const k = (kMax * t) / period // 扫第一布里渊区
      const omega = monoDispersion(k, a, kappa, mass)
      const disp: number[][] = []
      for (let i = 0; i <= 60; i++) {
        const kk = (kMax * i) / 60
        disp.push([kk, monoDispersion(kk, a, kappa, mass)])
      }
      const atoms: number[][] = []
      for (let n = 0; n < N_ATOMS; n++) {
        const x0 = n * a
        const u = 0.35 * Math.cos(k * x0 - omega * t)
        atoms.push([x0 + u, 0])
      }
      return {
        time: t,
        values: {
          kappa,
          mass,
          a,
          k,
          omega,
          kMax,
          period,
          tMax: period,
          world: N_ATOMS * a * 0.55,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: atoms, disp },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.kappa !== undefined) kappa = Number(params.kappa)
      if (params.mass !== undefined) mass = Number(params.mass)
      if (params.a !== undefined) a = Number(params.a)
    },
  }
}

export const latticeMonoMeta: DemoMeta = {
  id: 'lattice-mono',
  subject: '数理方法',
  category: '晶格振动',
  tags: ['晶格', '声子', '色散'],
  model: 'latticeMono',
  adapter: 'latticeMono',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'kappa', label: '劲度 κ', kind: 'number', default: 1, min: 0.4, max: 2, step: 0.1, unit: '' },
    { key: 'mass', label: '质量 m', kind: 'number', default: 1, min: 0.5, max: 2, step: 0.1, unit: '' },
    { key: 'a', label: '晶格常数 a', kind: 'number', default: 1, min: 0.7, max: 1.4, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '链 + 色散' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'ω(k)',
      chartKey: 'omega',
      charts: [
        {
          id: 'w',
          title: '色散扫区',
          xLabel: 't (s)',
          leftLabel: 'ω',
          series: [
            { key: 'omega', label: 'ω', color: '#fbbf24', unit: '' },
            { key: 'k', label: 'k', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'k', label: 'k', unit: '', tone: 'purple' },
    { key: 'omega', label: 'ω', unit: '', tone: 'amber' },
    { key: 'kMax', label: 'π/a', unit: '', tone: 'blue' },
  ],
  docs: {
    title: '单原子链振动与色散',
    summary: '一维单原子链 ω=2√(κ/m)|sin(ka/2)|。播放扫 k∈[0,π/a]，看色散与实空间波。',
    concept: [
      '最近邻弹簧模型',
      '第一布里渊区 |k|≤π/a',
      '长波 ω≈ a√(κ/m) |k|（声速）',
    ],
    objectives: ['观察色散曲线', '区界 k=π/a 频率最大', '看原子位移波'],
    formulas: ['\\omega=2\\sqrt{\\kappa/m}\\,|\\sin(ka/2)|'],
    insight: '上：原子链；下：色散，金点=当前 k。',
    legend: [
      { color: '#38bdf8', label: '原子' },
      { color: '#fbbf24', label: '色散 / 当前点' },
    ],
    steps: [
      {
        id: 'zone',
        title: '区界',
        body: '拖到末端，k→π/a。',
        formulas: ['k_{\\max}=\\pi/a'],
        bindings: [
          { labelTex: 'k', valueKey: 'k', unit: '' },
          { labelTex: '\\omega', valueKey: 'omega', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'edge',
        prompt: '使 k 接近 π/a。',
        hint: '播放到末尾。',
        check: { kind: 'valueNear', key: 'k', target: 3.0, tol: 1.2 },
      },
    ],
  },
}

export function registerLatticeMonoDemo(): void {
  registerDemoBundle({
    meta: latticeMonoMeta,
    model: createLatticeMonoModel,
    adapter: createLatticeMonoAdapter,
  })
}
