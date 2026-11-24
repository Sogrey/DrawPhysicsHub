import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createFoucaultAdapter } from './foucaultAdapter'

const G = 9.8

/** 傅科摆平面进动角速度 Ω_f = Ω_earth sin λ */
export function foucaultRate(OmegaEarth: number, latDeg: number): number {
  return OmegaEarth * Math.sin((latDeg * Math.PI) / 180)
}

export function createFoucaultModel(): PhysicsModel {
  let L = 2
  let lat = 45
  let OmegaE = 0.35 // 教学放大（真实地球 Ω 太慢）
  let ampDeg = 18
  let t = 0
  const period = 16
  let trail: number[][] = []

  function stateAt(time: number) {
    const OmF = foucaultRate(OmegaE, lat)
    const w = Math.sqrt(G / Math.max(0.2, L))
    const A = (ampDeg * Math.PI) / 180
    const T = Math.min(period, Math.max(0, time))
    // 摆平面以 OmF 旋转；摆在平面内简谐
    const alpha = OmF * T
    const theta = A * Math.cos(w * T)
    const xLocal = L * Math.sin(theta)
    const yLocal = 0
    const x = xLocal * Math.cos(alpha) - yLocal * Math.sin(alpha)
    const y = xLocal * Math.sin(alpha) + yLocal * Math.cos(alpha)
    const z = -L * Math.cos(theta)
    return { OmF, w, alpha, theta, x, y, z, xLocal }
  }

  function rebuildTrail(upto: number) {
    trail = []
    const n = Math.max(2, Math.ceil(upto / 0.04))
    for (let i = 0; i <= n; i++) {
      const ti = (upto * i) / n
      const s = stateAt(ti)
      trail.push([s.x, s.y])
    }
  }

  return {
    init(params: ParamValues) {
      L = Number(params.L ?? 2)
      lat = Number(params.lat ?? 45)
      OmegaE = Number(params.OmegaE ?? 0.35)
      ampDeg = Number(params.amp ?? 18)
      t = 0
      rebuildTrail(0)
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
      rebuildTrail(t)
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      if (trail.length === 0 || Math.abs(trail.length * 0.04 - t) > 0.1) rebuildTrail(t)
      else {
        const last = trail[trail.length - 1]
        if (!last || Math.hypot(last[0]! - s.x, last[1]! - s.y) > 0.02) trail.push([s.x, s.y])
      }
      return {
        time: t,
        values: {
          L,
          lat,
          OmegaE,
          ampDeg,
          OmF: s.OmF,
          alphaDeg: (s.alpha * 180) / Math.PI,
          thetaDeg: (s.theta * 180) / Math.PI,
          x: s.x,
          y: s.y,
          z: s.z,
          period,
          tMax: period,
          world: L + 0.8,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: trail.map((p) => [...p]) },
      }
    },
    reset() {
      t = 0
      trail = []
    },
    setParams(params) {
      if (params.L !== undefined) L = Number(params.L)
      if (params.lat !== undefined) lat = Number(params.lat)
      if (params.OmegaE !== undefined) OmegaE = Number(params.OmegaE)
      if (params.amp !== undefined) ampDeg = Number(params.amp)
    },
  }
}

export const foucaultMeta: DemoMeta = {
  id: 'theo-foucault',
  subject: '理论力学',
  category: '转动参考系',
  tags: ['傅科摆', '地球自转'],
  model: 'foucault',
  adapter: 'foucault',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'lat', label: '纬度 λ', kind: 'number', default: 45, min: 0, max: 90, step: 5, unit: '°' },
    { key: 'OmegaE', label: 'Ω（放大）', kind: 'number', default: 0.35, min: 0.05, max: 0.8, step: 0.05, unit: '' },
    { key: 'L', label: '摆长 L', kind: 'number', default: 2, min: 1, max: 3, step: 0.1, unit: '' },
    { key: 'amp', label: '振幅', kind: 'number', default: 18, min: 5, max: 30, step: 1, unit: '°' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '平面' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'α',
      chartKey: 'alphaDeg',
      charts: [
        {
          id: 'plane',
          title: '摆平面方位',
          xLabel: 't (s)',
          leftLabel: 'α (°)',
          series: [{ key: 'alphaDeg', label: 'α', color: '#a78bfa', unit: '°' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'OmF', label: 'Ω_f', unit: '', tone: 'purple' },
    { key: 'alphaDeg', label: 'α', unit: '°', tone: 'amber' },
    { key: 'lat', label: 'λ', unit: '°', tone: 'blue' },
  ],
  docs: {
    title: '傅科摆示意',
    summary:
      '摆平面相对地面以 Ω_f=Ω sinλ 缓慢旋转（教学放大 Ω）。赤道 λ=0 不转；极地最快。轨迹呈玫瑰线状。',
    concept: [
      '傅科摆证明地球自转',
      'Ω_f = Ω_earth sin λ',
      '惯性空间摆平面近似固定，地面跟着转',
    ],
    objectives: ['验证 Ω_f∝sinλ', '观察摆平面方位 α 随时间变化', '对比不同纬度'],
    formulas: ['\\Omega_f=\\Omega\\sin\\lambda', 'T_f=2\\pi/\\Omega_f'],
    insight: '紫线=瞬时摆平面；黄=地面轨迹。调纬度看进动快慢。Ω 已教学放大。',
    legend: [
      { color: '#a78bfa', label: '摆平面' },
      { color: '#fbbf24', label: '轨迹' },
      { color: '#38bdf8', label: '摆球' },
    ],
    steps: [
      {
        id: 'lat',
        title: '纬度',
        body: 'λ→90° 时 Ω_f↑；λ=0 时 Ω_f=0。',
        formulas: ['\\Omega_f\\propto\\sin\\lambda'],
        bindings: [
          { labelTex: '\\lambda', valueKey: 'lat', unit: '°' },
          { labelTex: '\\Omega_f', valueKey: 'OmF', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'pole',
        prompt: '取 λ≈90°，使 Ω_f 接近 Ω。',
        hint: 'sin90°=1。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'lat', target: 90, tol: 10 },
            { kind: 'valueNear', key: 'OmF', target: 0.35, tol: 0.12 },
          ],
        },
      },
    ],
  },
}

export function registerFoucaultDemo(): void {
  registerDemoBundle({
    meta: foucaultMeta,
    model: createFoucaultModel,
    adapter: createFoucaultAdapter,
  })
}
