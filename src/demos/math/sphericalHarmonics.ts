import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createSphericalHarmonicsAdapter } from './sphericalHarmonicsAdapter'

/** 实球谐示意（未归一）：Y00、Y10∝cosθ、Y11∝sinθ cosφ、Y20∝(3cos²θ−1) */
export function realYlm(l: number, m: number, theta: number, phi: number): number {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  if (l === 0) return 0.28
  if (l === 1 && m === 0) return 0.55 * c
  if (l === 1 && Math.abs(m) === 1) return 0.55 * s * Math.cos(phi)
  if (l === 2 && m === 0) return 0.45 * (3 * c * c - 1)
  if (l === 2 && Math.abs(m) === 1) return 0.5 * s * c * Math.cos(phi)
  if (l === 2 && Math.abs(m) === 2) return 0.4 * s * s * Math.cos(2 * phi)
  return 0.28 * c
}

export function createSphericalHarmonicsModel(): PhysicsModel {
  let L = 1
  let M = 0
  let t = 0
  const period = 8
  const NTH = 28
  const NPH = 48

  return {
    init(params: ParamValues) {
      L = Math.round(Number(params.L ?? 1))
      M = Math.round(Number(params.M ?? 0))
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      // 播放旋转观察角
      const yaw = (2 * Math.PI * t) / period
      const pts: number[][] = []
      for (let i = 0; i <= NTH; i++) {
        const th = (Math.PI * i) / NTH
        for (let j = 0; j <= NPH; j++) {
          const ph = (2 * Math.PI * j) / NPH
          const y = realYlm(L, M, th, ph)
          const r = 1.1 + 1.1 * Math.abs(y)
          const sign = y >= 0 ? 1 : -1
          const x = r * Math.sin(th) * Math.cos(ph)
          const yy = r * Math.cos(th)
          const z = r * Math.sin(th) * Math.sin(ph)
          pts.push([x, yy, z, sign])
        }
      }
      return {
        time: t,
        values: {
          L,
          M: Math.min(L, Math.max(-L, M)),
          yaw: (yaw * 180) / Math.PI,
          period,
          tMax: period,
          world: 3.2,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: pts },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.L !== undefined) L = Math.round(Number(params.L))
      if (params.M !== undefined) M = Math.round(Number(params.M))
    },
  }
}

export const sphericalHarmonicsMeta: DemoMeta = {
  id: 'math-spherical-harmonics',
  subject: '数理方法',
  category: '特殊函数',
  tags: ['球谐', '角动量'],
  model: 'sphericalHarmonics',
  adapter: 'sphericalHarmonics',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: false },
  params: [
    { key: 'L', label: 'l', kind: 'number', default: 1, min: 0, max: 2, step: 1, unit: '' },
    { key: 'M', label: 'm', kind: 'number', default: 0, min: -2, max: 2, step: 1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '截面' },
    { id: 'scene3d', kind: 'three', title: '3D 花瓣' },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'L', label: 'l', unit: '', tone: 'purple' },
    { key: 'M', label: 'm', unit: '', tone: 'amber' },
    { key: 'yaw', label: '视角', unit: '°', tone: 'blue' },
  ],
  docs: {
    title: '球谐函数 Yₗₘ 示意',
    summary:
      '实球谐径向调制：r∝|Y|，颜色分正负叶。l=0 球；l=1 哑铃；l=2 四叶等。播放旋转观察。',
    concept: [
      '角动量量子数 l、m',
      '|m|≤l',
      '节点与对称性随 l,m 变化',
    ],
    objectives: ['辨认 l=0/1/2 形貌', '观察 m 改变方位角结构', '联系原子轨道角向部分'],
    formulas: ['Y_{00}\\propto 1', 'Y_{10}\\propto\\cos\\theta', 'Y_{1\\pm1}\\propto\\sin\\theta\\,e^{\\pm i\\phi}'],
    insight: '青=正叶，粉=负叶。调 l、m 看花瓣数。',
    legend: [
      { color: '#38bdf8', label: 'Y>0' },
      { color: '#f472b6', label: 'Y<0' },
    ],
    steps: [
      {
        id: 'p',
        title: 'p 轨道',
        body: 'l=1,m=0 → 沿 z 哑铃。',
        formulas: ['Y_{10}'],
        bindings: [
          { labelTex: 'l', valueKey: 'L', unit: '' },
          { labelTex: 'm', valueKey: 'M', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'd',
        prompt: '取 l=2、m=0，观察四叶截面。',
        hint: '旋钮设 l=2。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'L', target: 2, tol: 0.5 },
            { kind: 'paramNear', key: 'M', target: 0, tol: 0.5 },
          ],
        },
      },
    ],
  },
}

export function registerSphericalHarmonicsDemo(): void {
  registerDemoBundle({
    meta: sphericalHarmonicsMeta,
    model: createSphericalHarmonicsModel,
    adapter: createSphericalHarmonicsAdapter,
  })
}
