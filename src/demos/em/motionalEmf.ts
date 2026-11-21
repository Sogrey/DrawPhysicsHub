import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createMotionalEmfAdapter } from './motionalEmfAdapter'

/**
 * 动生电动势（导轨 + 滑杆，匀强 B 出纸面）：
 *   杆长 L（沿 y），位置 x(t)，速度 v=dx/dt
 *   Φ = B L x
 *   ε = B L v   （= −dΦ/dt 的符号约定：v>0 面积增大、出纸面磁通增 → 感应电动势驱使电流产生入纸面场）
 *   I = ε / R
 *   杆受安培力 F = −I L B ŷ×? 杆电流沿 ±y，B 沿 z：
 *     取 I>0 为杆上电流 +y→−y（顺时针绕回路）时 F 沿 −x（阻碍扩张）
 *
 * 教学符号：ε = B L v（v 带符号），I = ε/R；
 * 楞次：面积增大（v>0）时感应电流产生的场入纸面，电流在滑杆上向下（−y）。
 *
 * 播放：滑杆从近端匀速扫到远端。
 */
export function motionalState(
  B: number,
  L: number,
  x: number,
  v: number,
  R: number,
): {
  Phi: number
  emf: number
  I: number
  F: number
  Fx: number
} {
  const BB = B
  const LL = Math.max(0.2, L)
  const RR = Math.max(1e-6, R)
  const Phi = BB * LL * x
  const emf = BB * LL * v
  const I = emf / RR
  // 安培力：阻碍相对运动。v>0 → F_x < 0
  // |F| = |I| L |B|，符号 −sign(I·B) 与 v 相反：F_x = −I L B（I=BLv/R → F=−B²L²v/R）
  const Fx = -I * LL * BB
  return { Phi, emf, I, F: Math.abs(Fx), Fx }
}

export function createMotionalEmfModel(): PhysicsModel {
  let B = 1.2
  let L = 2
  let R = 1
  let v = 0.8
  let xMin = 0.6
  let xMax = 4
  let t = 0

  function period() {
    const dist = Math.max(0.5, xMax - xMin)
    return dist / Math.max(0.15, Math.abs(v))
  }

  function xAt(time: number) {
    const T = period()
    const u = Math.min(1, Math.max(0, time / T))
    // 恒定 +v 扫过
    const speed = Math.abs(v)
    return xMin + speed * (u * T)
  }

  return {
    init(params: ParamValues) {
      B = Number(params.B ?? 1.2)
      L = Number(params.L ?? 2)
      R = Number(params.R ?? 1)
      v = Number(params.v ?? 0.8)
      xMin = Number(params.xMin ?? 0.6)
      xMax = Number(params.xMax ?? 4)
      t = 0
    },
    step(dt: number) {
      const T = period()
      t = Math.min(T, t + dt)
    },
    seek(time: number) {
      const T = period()
      t = Math.min(T, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const T = period()
      const x = xAt(t)
      const speed = Math.abs(v) // 播放段恒为 +|v|
      const s = motionalState(B, L, x, speed, R)
      return {
        time: t,
        values: {
          B,
          L,
          R,
          v: speed,
          vParam: v,
          xMin,
          xMax,
          x,
          Phi: s.Phi,
          emf: s.emf,
          I: s.I,
          F: s.F,
          Fx: s.Fx,
          area: L * x,
          period: T,
          tMax: T,
          world: Math.max(5.5, xMax + 1.5),
          Bout: B >= 0 ? 1 : 0,
          done: t >= T - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.B !== undefined) B = Number(params.B)
      if (params.L !== undefined) L = Number(params.L)
      if (params.R !== undefined) R = Number(params.R)
      if (params.v !== undefined) v = Number(params.v)
      if (params.xMin !== undefined) xMin = Number(params.xMin)
      if (params.xMax !== undefined) xMax = Number(params.xMax)
    },
  }
}

export const motionalEmfMeta: DemoMeta = {
  id: 'em-motional-emf',
  subject: '电磁学',
  category: '电磁感应',
  tags: ['动生', '切割磁感线', '感应'],
  model: 'motionalEmf',
  adapter: 'motionalEmf',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'B',
      label: '磁感应 B',
      kind: 'number',
      default: 1.2,
      min: 0.3,
      max: 2.5,
      step: 0.1,
      unit: 'T',
    },
    {
      key: 'L',
      label: '杆长 L',
      kind: 'number',
      default: 2,
      min: 1,
      max: 3,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'v',
      label: '速度 v',
      kind: 'number',
      default: 0.8,
      min: 0.3,
      max: 1.5,
      step: 0.1,
      unit: 'm/s',
    },
    {
      key: 'R',
      label: '电阻 R',
      kind: 'number',
      default: 1,
      min: 0.3,
      max: 3,
      step: 0.1,
      unit: 'Ω',
    },
    {
      key: 'xMax',
      label: '最大行程',
      kind: 'number',
      default: 4,
      min: 2.5,
      max: 5.5,
      step: 0.25,
      unit: 'm',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '动生' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'emf',
      charts: [
        {
          id: 'emf',
          title: '电动势与磁通',
          xLabel: 't (s)',
          leftLabel: 'ε / Φ',
          series: [
            { key: 'emf', label: 'ε', color: '#fbbf24', unit: 'V' },
            { key: 'Phi', label: 'Φ', color: '#38bdf8', unit: 'Wb' },
            { key: 'I', label: 'I', color: '#4ade80', unit: 'A' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'x', label: 'x', unit: 'm', tone: 'amber' },
    { key: 'emf', label: 'ε', unit: 'V', tone: 'green' },
    { key: 'Phi', label: 'Φ', unit: 'Wb', tone: 'blue' },
    { key: 'I', label: 'I', unit: 'A', tone: 'purple' },
    { key: 'F', label: '|F|', unit: 'u', tone: 'slate' },
  ],
  docs: {
    title: '动生电动势',
    summary:
      '导轨上滑杆以速度 v 切割磁感线：ε=BLv，Φ=BLx。面积增大时感应电流反抗磁通增加；杆受安培力阻碍运动。',
    concept: [
      '动生电动势来自电荷在磁场中受力（洛伦兹）沿杆分离。',
      '也可写成 ε=−dΦ/dt；匀速扩张时 Φ∝x，ε=BLv 恒定。',
      '楞次：感应电流的安培力总是阻碍相对运动（电磁阻尼）。',
    ],
    objectives: [
      '对照 ε=BLv 与顶栏读数',
      '观察 Φ 随 x 增大而 I、ε 近似恒定',
      '辨认粉箭头安培力与速度相反',
    ],
    formulas: [
      '\\mathcal{E}=BLv',
      '\\Phi=BLx',
      'I=\\mathcal{E}/R',
      'F_x=-I L B=-\\dfrac{B^2 L^2 v}{R}',
    ],
    insight:
      '灰点为 B；青绿为导轨与感应电流；黄杆为滑杆；粉箭头为阻碍运动的安培力。拖时间轴看面积变大。',
    legend: [
      { color: '#94a3b8', label: 'B 场（·）' },
      { color: '#4ade80', label: '导轨 / 感应电流' },
      { color: '#fbbf24', label: '滑杆' },
      { color: '#f472b6', label: '安培力（阻尼）' },
      { color: '#38bdf8', label: '回路面积' },
    ],
    steps: [
      {
        id: 'emf',
        title: '动生电动势',
        body: '切割磁感线：ε=BLv。',
        formulas: ['\\mathcal{E}=BLv'],
        bindings: [
          { labelTex: 'B', valueKey: 'B', unit: 'T' },
          { labelTex: 'L', valueKey: 'L', unit: 'm' },
          { labelTex: 'v', valueKey: 'v', unit: 'm/s' },
          { labelTex: '\\mathcal{E}', valueKey: 'emf', unit: 'V' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'flux',
        title: '磁通',
        body: '回路磁通 Φ=BLx，随杆外移增大。',
        formulas: ['\\Phi=BLx'],
        bindings: [
          { labelTex: 'x', valueKey: 'x', unit: 'm' },
          { labelTex: '\\Phi', valueKey: 'Phi', unit: 'Wb' },
        ],
      },
      {
        id: 'lenz',
        title: '楞次 / 阻尼',
        body: '感应电流使杆受阻碍力 F∝−v。',
        formulas: ['F_x=-B^2 L^2 v / R'],
        bindings: [
          { labelTex: 'I', valueKey: 'I', unit: 'A' },
          { labelTex: '|F|', valueKey: 'F', unit: 'u' },
        ],
      },
    ],
    challenges: [
      {
        id: 'emf-val',
        prompt: '取 B=1.2、L=2、v=0.8，使 ε≈1.92 V。',
        hint: 'ε=BLv=1.2×2×0.8=1.92。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'B', target: 1.2, tol: 0.1 },
            { kind: 'paramNear', key: 'L', target: 2, tol: 0.1 },
            { kind: 'paramNear', key: 'v', target: 0.8, tol: 0.1 },
            { kind: 'valueNear', key: 'emf', target: 1.92, tol: 0.2 },
          ],
        },
      },
      {
        id: 'flux-grow',
        prompt: '拖到行程后半（x 较大），使 Φ 明显大于起始。',
        hint: 'Φ=BLx，x 越大 Φ 越大。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'x', target: 3.2, tol: 1.2 },
            { kind: 'valueNear', key: 'Phi', target: 6, tol: 4 },
          ],
        },
      },
    ],
  },
}

export function registerMotionalEmfDemo(): void {
  registerDemoBundle({
    meta: motionalEmfMeta,
    model: createMotionalEmfModel,
    adapter: createMotionalEmfAdapter,
  })
}
