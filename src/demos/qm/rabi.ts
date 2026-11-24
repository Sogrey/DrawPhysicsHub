import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createRabiAdapter } from './rabiAdapter'

/** 共振拉比：P_e = sin²(Ω t / 2) */
export function rabiExcitedProb(Omega: number, t: number): number {
  return Math.sin((Omega * t) / 2) ** 2
}

export function createRabiModel(): PhysicsModel {
  let Omega = 2
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      Omega = Number(p.Omega ?? 2)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const Pe = rabiExcitedProb(Omega, t)
      const Pg = 1 - Pe
      const path: number[][] = []
      for (let i = 0; i <= 80; i++) {
        const tt = (period * i) / 80
        path.push([tt, rabiExcitedProb(Omega, tt)])
      }
      return {
        time: t,
        values: {
          Omega,
          Pe,
          Pg,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.Omega !== undefined) Omega = Number(p.Omega)
    },
  }
}

export const rabiMeta: DemoMeta = {
  id: 'qm-rabi',
  subject: '量子力学',
  category: '自旋与原子',
  tags: ['拉比', '二能级'],
  model: 'rabi',
  adapter: 'rabi',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [{ key: 'Omega', label: '拉比频率 Ω', kind: 'number', default: 2, min: 0.5, max: 4, step: 0.1, unit: '' }],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '拉比' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'Pe',
      chartKey: 'Pe',
      charts: [{ id: 'p', title: '激发概率', xLabel: 't', leftLabel: 'P', series: [{ key: 'Pe', label: 'Pe', color: '#fbbf24', unit: '' }, { key: 'Pg', label: 'Pg', color: '#38bdf8', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'Omega', label: 'Ω', unit: '', tone: 'slate' },
    { key: 'Pe', label: 'Pe', unit: '', tone: 'amber' },
  ],
  docs: {
    title: '二能级拉比振荡',
    summary: '共振驱动下 Pe=sin²(Ωt/2)，基态↔激发态周期交换。',
    concept: ['拉比频率', '二能级', '布居振荡'],
    objectives: ['调 Ω 看周期', '播放看 Pe', '对照 Pg+Pe=1'],
    formulas: ['P_e=\\sin^2(\\Omega t/2)'],
    insight: '金=激发概率曲线；柱高=当前 Pe/Pg。',
    legend: [{ color: '#fbbf24', label: '激发' }, { color: '#38bdf8', label: '基态' }],
    steps: [{ id: 'osc', title: '振荡', body: '播放至少一个半周期。', formulas: ['\\Omega'], bindings: [{ labelTex: 'P_e', valueKey: 'Pe', unit: '' }] }],
    challenges: [{ id: 'fast', prompt: '取 Ω≥3。', hint: '调大拉比频率。', check: { kind: 'paramNear', key: 'Omega', target: 3.5, tol: 0.6 } }],
  },
}

export function registerRabiDemo() {
  registerDemoBundle({ meta: rabiMeta, model: createRabiModel, adapter: createRabiAdapter })
}
