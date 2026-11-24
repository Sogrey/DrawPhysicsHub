import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createEmReflectionAdapter } from './emReflectionAdapter'

/**
 * 正入射界面反射/透射（阻抗匹配示意）：
 *   Z = √(μ/ε) ≈ 1/n（教学单位）；r=(Z2−Z1)/(Z2+Z1)，t=2 Z2/(Z2+Z1)
 *   R=r²，T=1−R（非磁性介质能量守恒示意）
 */
export function fresnelNormal(n1: number, n2: number): { r: number; t: number; R: number; T: number } {
  const Z1 = 1 / Math.max(1e-6, n1)
  const Z2 = 1 / Math.max(1e-6, n2)
  const r = (Z2 - Z1) / (Z2 + Z1)
  const t = (2 * Z2) / (Z2 + Z1)
  const R = r * r
  const T = Math.max(0, 1 - R)
  return { r, t, R, T }
}

export function createEmReflectionModel(): PhysicsModel {
  let n1 = 1
  let n2 = 1.5
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      n1 = Number(params.n1 ?? 1)
      n2 = Number(params.n2 ?? 1.5)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      // 播放时扫 n₂：1 → 2.5；t=0 用参数初值
      const n2Live = 1 + (1.5 * t) / period
      const nn2 = t <= 1e-9 ? n2 : n2Live
      const f = fresnelNormal(n1, nn2)
      const phase = (2 * Math.PI * t) / period
      const Ei = Math.cos(phase)
      const Er = f.r * Ei
      const Et = f.t * Ei
      return {
        time: t,
        values: {
          n1,
          n2: nn2,
          n2Param: n2,
          r: f.r,
          tAmp: f.t,
          R: f.R,
          T: f.T,
          Ei,
          Er,
          Et,
          period,
          tMax: period,
          world: 5,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.n1 !== undefined) n1 = Number(params.n1)
      if (params.n2 !== undefined) n2 = Number(params.n2)
    },
  }
}

export const emReflectionMeta: DemoMeta = {
  id: 'em-reflection',
  subject: '电磁学',
  category: '电磁波',
  tags: ['反射', '透射', '阻抗'],
  model: 'emReflection',
  adapter: 'emReflection',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'n1', label: 'n₁', kind: 'number', default: 1, min: 1, max: 2, step: 0.05, unit: '' },
    { key: 'n2', label: 'n₂（初值）', kind: 'number', default: 1.5, min: 1, max: 2.5, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '界面' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'R/T',
      chartKey: 'R',
      charts: [
        {
          id: 'rt',
          title: '反射 / 透射',
          xLabel: 't (s)',
          leftLabel: '系数',
          series: [
            { key: 'R', label: 'R', color: '#f472b6', unit: '' },
            { key: 'T', label: 'T', color: '#4ade80', unit: '' },
            { key: 'n2', label: 'n₂', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'n2', label: 'n₂', unit: '', tone: 'purple' },
    { key: 'R', label: 'R', unit: '', tone: 'pink' },
    { key: 'T', label: 'T', unit: '', tone: 'green' },
  ],
  docs: {
    title: '界面反射 / 透射系数',
    summary:
      '正入射：阻抗 Z∝1/n。振幅反射 r=(Z₂−Z₁)/(Z₂+Z₁)，能量反射 R=r²，透射 T≈1−R。播放时扫 n₂，看 R、T 变化；n₁=n₂ 时无反射。',
    concept: [
      '阻抗失配 → 部分反射',
      '匹配 n₁=n₂ ⇒ r=0、R=0',
      '从光疏→光密：r<0（半波损失示意）',
    ],
    objectives: ['观察 R(n₂)', '验证匹配时 R=0', '理解半波损失符号'],
    formulas: ['r=\\frac{Z_2-Z_1}{Z_2+Z_1}', 'R=r^2', 'T\\approx 1-R'],
    insight: '左介质 n₁，右 n₂；粉=反射波，绿=透射。扫 n₂ 看 R 上升。',
    legend: [
      { color: '#38bdf8', label: '入射' },
      { color: '#f472b6', label: '反射' },
      { color: '#4ade80', label: '透射' },
    ],
    steps: [
      {
        id: 'match',
        title: '匹配',
        body: '当 n₂→n₁，R→0。',
        formulas: ['R\\to 0\\ (n_1=n_2)'],
        bindings: [
          { labelTex: 'R', valueKey: 'R', unit: '' },
          { labelTex: 'n_2', valueKey: 'n2', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'highR',
        prompt: '播放至 n₂≈2.2，使 R>0.1。',
        hint: '拖到后半段。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'n2', target: 2.2, tol: 0.5 },
            { kind: 'valueNear', key: 'R', target: 0.15, tol: 0.12 },
          ],
        },
      },
    ],
  },
}

export function registerEmReflectionDemo(): void {
  registerDemoBundle({
    meta: emReflectionMeta,
    model: createEmReflectionModel,
    adapter: createEmReflectionAdapter,
  })
}
