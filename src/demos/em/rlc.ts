import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createRlcAdapter } from './rlcAdapter'

export function rlcImpedance(R: number, L: number, C: number, omega: number) {
  const XL = omega * L
  const XC = 1 / Math.max(1e-9, omega * C)
  const X = XL - XC
  const Z = Math.hypot(R, X)
  const I = 1 / Math.max(1e-9, Z) // V=1
  const w0 = 1 / Math.sqrt(Math.max(1e-9, L * C))
  const Q = (w0 * L) / Math.max(1e-9, R)
  return { Z, I, X, w0, Q, XL, XC }
}

export function createRlcModel(): PhysicsModel {
  let R = 0.4
  let L = 1
  let C = 0.5
  let t = 0
  const period = 8
  return {
    init(p: ParamValues) {
      R = Number(p.R ?? 0.4)
      L = Number(p.L ?? 1)
      C = Number(p.C ?? 0.5)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const base = rlcImpedance(R, L, C, 1)
      const w0 = base.w0
      const omega = 0.2 * w0 + ((2.5 * w0 - 0.2 * w0) * t) / period
      const s = rlcImpedance(R, L, C, omega)
      const curve: number[][] = []
      for (let i = 0; i <= 60; i++) {
        const w = 0.2 * w0 + ((2.5 * w0 - 0.2 * w0) * i) / 60
        curve.push([w, rlcImpedance(R, L, C, w).I])
      }
      return {
        time: t,
        values: {
          R,
          L,
          C,
          omega,
          ...s,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: curve },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.R !== undefined) R = Number(p.R)
      if (p.L !== undefined) L = Number(p.L)
      if (p.C !== undefined) C = Number(p.C)
    },
  }
}

export const rlcMeta: DemoMeta = {
  id: 'em-rlc',
  subject: '电磁学',
  category: '交流电路',
  tags: ['RLC', '谐振', 'Q'],
  model: 'rlc',
  adapter: 'rlc',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'R', label: 'R', kind: 'number', default: 0.4, min: 0.15, max: 1.5, step: 0.05, unit: '' },
    { key: 'L', label: 'L', kind: 'number', default: 1, min: 0.4, max: 2, step: 0.1, unit: '' },
    { key: 'C', label: 'C', kind: 'number', default: 0.5, min: 0.2, max: 1.2, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '谐振' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'I',
      chartKey: 'I',
      charts: [
        {
          id: 'i',
          title: '电流振幅',
          xLabel: 't',
          leftLabel: 'I',
          series: [
            { key: 'I', label: 'I(ω)', color: '#fbbf24', unit: '' },
            { key: 'omega', label: 'ω', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'omega', label: 'ω', unit: '', tone: 'purple' },
    { key: 'I', label: 'I', unit: '', tone: 'amber' },
    { key: 'Q', label: 'Q', unit: '', tone: 'blue' },
  ],
  docs: {
    title: 'RLC 串联谐振',
    summary: '扫频：I=V/|Z|，ω₀=1/√(LC) 处电流最大。Q=ω₀L/R，R↓峰更尖。',
    concept: ['谐振 ω₀=1/√(LC)', '品质因数 Q', '失谐 |Z|↑'],
    objectives: ['找到谐振峰', '减小 R 看尖峰', '读出 Q'],
    formulas: ['\\omega_0=1/\\sqrt{LC}', 'Q=\\omega_0 L/R', 'Z=\\sqrt{R^2+(X_L-X_C)^2}'],
    insight: '曲线=I(ω)；金点=当前频率。',
    legend: [
      { color: '#fbbf24', label: 'I(ω)' },
      { color: '#a78bfa', label: '当前 ω' },
    ],
    steps: [
      {
        id: 'peak',
        title: '谐振',
        body: '拖到峰顶附近。',
        formulas: ['\\omega\\approx\\omega_0'],
        bindings: [
          { labelTex: 'I', valueKey: 'I', unit: '' },
          { labelTex: '\\omega_0', valueKey: 'w0', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'near',
        prompt: '使 ω 接近 ω₀（相对误差<20%）。',
        hint: '播放中段。',
        check: { kind: 'valueNear', key: 'I', target: 2, tol: 2 },
      },
    ],
  },
}

export function registerRlcDemo(): void {
  registerDemoBundle({ meta: rlcMeta, model: createRlcModel, adapter: createRlcAdapter })
}
