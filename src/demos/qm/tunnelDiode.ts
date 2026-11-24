import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createTunnelDiodeAdapter } from './tunnelDiodeAdapter'

/** 教学 I–V：高斯峰 + 正向扩散尾，形成峰-谷负阻 */
export function tunnelCurrent(V: number, peak = 1, valley = 0.35): number {
  const v = Math.max(0, V)
  const peakTerm = peak * Math.exp(-((v - 0.35) * (v - 0.35)) / (2 * 0.12 * 0.12))
  const floor = valley * 0.25
  const diode = 0.08 * Math.exp(2.4 * (v - 1.4))
  return peakTerm + floor + Math.max(0, diode)
}

export function createTunnelDiodeModel(): PhysicsModel {
  let peak = 1
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      peak = Number(p.peak ?? 1)
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const path: number[][] = []
      let Vp = 0
      let Ip = 0
      for (let i = 0; i <= 80; i++) {
        const V = (2.2 * i) / 80
        const I = tunnelCurrent(V, peak)
        path.push([V, I])
        if (I > Ip && V < 1) {
          Ip = I
          Vp = V
        }
      }
      const Vnow = (2.2 * t) / period
      const Inow = tunnelCurrent(Vnow, peak)
      return {
        time: t,
        values: {
          peak,
          Vnow,
          Inow,
          Vp,
          Ip,
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
      if (p.peak !== undefined) peak = Number(p.peak)
    },
  }
}

export const tunnelDiodeMeta: DemoMeta = {
  id: 'qm-tunnel-diode',
  subject: '量子力学',
  category: '散射与隧道',
  tags: ['隧道', '非线性'],
  model: 'tunnelDiode',
  adapter: 'tunnelDiode',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [{ key: 'peak', label: '峰电流系数', kind: 'number', default: 1, min: 0.5, max: 1.8, step: 0.1, unit: '' }],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'I–V' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'I',
      chartKey: 'Inow',
      charts: [{ id: 'i', title: '电流', xLabel: 't', leftLabel: 'I', series: [{ key: 'Inow', label: 'I', color: '#fbbf24', unit: '' }] }],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'Vnow', label: 'V', unit: '', tone: 'slate' },
    { key: 'Inow', label: 'I', unit: '', tone: 'amber' },
    { key: 'Vp', label: 'Vp', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '隧道二极管 I–V 示意',
    summary: '重掺杂结中隧道电流形成峰-谷负阻区，之后正向扩散电流主导。',
    concept: ['量子隧穿', '负阻', 'Esaki 二极管'],
    objectives: ['播放扫电压', '找到峰点 Vp', '调峰系数'],
    formulas: ['I_{tun}\\sim V e^{-\\alpha V}', '负阻:\\,dI/dV<0'],
    insight: '金曲线=I(V)；粉点=扫描位置。',
    legend: [{ color: '#fbbf24', label: 'I–V' }],
    steps: [{ id: 'peak', title: '峰电流', body: '播放经过电流峰。', formulas: ['V_p'], bindings: [{ labelTex: 'V_p', valueKey: 'Vp', unit: '' }] }],
    challenges: [{ id: 'tall', prompt: '取峰系数≥1.4。', hint: '调 peak。', check: { kind: 'paramNear', key: 'peak', target: 1.5, tol: 0.25 } }],
  },
}

export function registerTunnelDiodeDemo() {
  registerDemoBundle({
    meta: tunnelDiodeMeta,
    model: createTunnelDiodeModel,
    adapter: createTunnelDiodeAdapter,
  })
}
