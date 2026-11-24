import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createFresnelZoneAdapter } from './fresnelZoneAdapter'

/** 半波带半径 ρ_m ≈ √(m λ b)（傍轴） */
export function zoneRadius(m: number, lambda: number, b: number): number {
  return Math.sqrt(Math.max(0, m) * Math.max(1e-6, lambda) * Math.max(1e-6, b))
}

export function createFresnelZoneModel(): PhysicsModel {
  let lambda = 0.6
  let b = 2
  let zones = 5
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      lambda = Number(p.lambda ?? 0.6)
      b = Number(p.b ?? 2)
      zones = Math.round(Number(p.zones ?? 5))
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const n = Math.min(8, Math.max(1, zones))
      const live = Math.max(1, Math.round(1 + ((n - 1) * t) / period))
      const radii: number[][] = []
      for (let m = 1; m <= n; m++) radii.push([m, zoneRadius(m, lambda, b)])
      const r1 = zoneRadius(1, lambda, b)
      return {
        time: t,
        values: {
          lambda,
          b,
          zones: n,
          live,
          r1,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: radii },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.lambda !== undefined) lambda = Number(p.lambda)
      if (p.b !== undefined) b = Number(p.b)
      if (p.zones !== undefined) zones = Math.round(Number(p.zones))
    },
  }
}

export const fresnelZoneMeta: DemoMeta = {
  id: 'opt-fresnel-zone',
  subject: '光学',
  category: '衍射',
  tags: ['菲涅耳', '波带'],
  model: 'fresnelZone',
  adapter: 'fresnelZone',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'lambda', label: 'λ', kind: 'number', default: 0.6, min: 0.3, max: 1, step: 0.05, unit: '' },
    { key: 'b', label: '距离 b', kind: 'number', default: 2, min: 1, max: 4, step: 0.2, unit: '' },
    { key: 'zones', label: '波带数', kind: 'number', default: 5, min: 1, max: 8, step: 1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '波带' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'r₁',
      chartKey: 'r1',
      charts: [{ id: 'r', title: '第一波带半径', xLabel: 't', leftLabel: 'r', series: [{ key: 'r1', label: 'r₁', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'live', label: '区数', unit: '', tone: 'amber' },
    { key: 'r1', label: 'r₁', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '菲涅耳波带片示意',
    summary: '半波带半径 ρ_m≈√(mλb)。奇/偶带交替贡献，波带片可聚焦。',
    concept: ['半波带', '菲涅耳衍射', '波带片'],
    objectives: ['改 λ、b 看半径', '播放逐带出现', '对照 √m 规律'],
    formulas: ['\\rho_m\\approx\\sqrt{m\\lambda b}'],
    insight: '环带明暗交替示意；播放逐层点亮。',
    legend: [{ color: '#fbbf24', label: '奇带' }, { color: '#334155', label: '偶带' }],
    steps: [{ id: 'zones', title: '波带', body: '播放看波带逐层出现。', formulas: ['\\rho_m'], bindings: [{ labelTex: 'r_1', valueKey: 'r1', unit: '' }] }],
    challenges: [{ id: 'more', prompt: '取波带数≥6。', hint: '调 zones。', check: { kind: 'paramNear', key: 'zones', target: 7, tol: 1.5 } }],
  },
}

export function registerFresnelZoneDemo() {
  registerDemoBundle({ meta: fresnelZoneMeta, model: createFresnelZoneModel, adapter: createFresnelZoneAdapter })
}
