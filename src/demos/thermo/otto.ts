import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createOttoAdapter } from './ottoAdapter'

/** 奥托效率 η = 1 − r^(1−γ) */
export function ottoEfficiency(r: number, gamma = 1.4): number {
  return 1 - Math.pow(Math.max(1.01, r), 1 - gamma)
}

export function createOttoModel(): PhysicsModel {
  let r = 8
  let gamma = 1.4
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      r = Number(p.r ?? 8)
      gamma = Number(p.gamma ?? 1.4)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const eta = ottoEfficiency(r, gamma)
      // 简化 P–V：1-2 绝热压缩，2-3 等容加热，3-4 绝热膨胀，4-1 等容放热
      const V1 = r
      const V2 = 1
      const P1 = 1
      const P2 = P1 * Math.pow(r, gamma)
      const P3 = P2 * 2.2
      const P4 = P3 * Math.pow(1 / r, gamma)
      const corners: number[][] = [
        [V1, P1],
        [V2, P2],
        [V2, P3],
        [V1, P4],
        [V1, P1],
      ]
      const u = t / period
      const seg = Math.min(3, Math.floor(u * 4))
      const f = u * 4 - seg
      const a = corners[seg]!
      const b = corners[seg + 1]!
      const Vx = a[0]! + (b[0]! - a[0]!) * f
      const Px = a[1]! + (b[1]! - a[1]!) * f
      return {
        time: t,
        values: {
          r,
          gamma,
          eta,
          Vx,
          Px,
          seg,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: corners },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.r !== undefined) r = Number(p.r)
      if (p.gamma !== undefined) gamma = Number(p.gamma)
    },
  }
}

export const ottoMeta: DemoMeta = {
  id: 'thermo-otto',
  subject: '热学',
  category: '热力学循环',
  tags: ['内燃机', '循环'],
  model: 'otto',
  adapter: 'otto',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'r', label: '压缩比 r', kind: 'number', default: 8, min: 4, max: 12, step: 0.5, unit: '' },
    { key: 'gamma', label: 'γ', kind: 'number', default: 1.4, min: 1.2, max: 1.6, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '奥托' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'η',
      chartKey: 'eta',
      charts: [{ id: 'e', title: '热效率', xLabel: 't', leftLabel: 'η', series: [{ key: 'eta', label: 'η', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'r', label: 'r', unit: '', tone: 'slate' },
    { key: 'eta', label: 'η', unit: '', tone: 'amber' },
    { key: 'seg', label: '段', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '奥托循环示意',
    summary: '理想奥托：η=1−r^(1−γ)。P–V 图上两绝热+两等容。',
    concept: ['压缩比', '热效率', '内燃机循环'],
    objectives: ['增大 r 看 η↑', '播放沿循环行走', '辨认四过程'],
    formulas: ['\\eta=1-r^{1-\\gamma}'],
    insight: '金折线=循环；粉点=当前状态。',
    legend: [{ color: '#fbbf24', label: '循环' }],
    steps: [{ id: 'r', title: '压缩比', body: '增大 r 观察效率。', formulas: ['\\eta'], bindings: [{ labelTex: '\\eta', valueKey: 'eta', unit: '' }] }],
    challenges: [{ id: 'hi', prompt: '取 r≥10。', hint: '调压缩比。', check: { kind: 'paramNear', key: 'r', target: 11, tol: 1.5 } }],
  },
}

export function registerOttoDemo() {
  registerDemoBundle({ meta: ottoMeta, model: createOttoModel, adapter: createOttoAdapter })
}
