import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createWireBAdapter } from './wireBAdapter'

/**
 * 无限长直导线磁场（教学单位取 μ₀/(2π)=1）：
 *   |B| = I / r ，方向由右手定则（I>0 出纸面 → 逆时针）。
 * 探测点沿半径 R 绕行。
 */
export function createWireBModel(): PhysicsModel {
  let I = 2
  let R = 2
  let t = 0

  function period() {
    return 6
  }

  /** B at (x,y); wire through origin along z */
  function fieldAt(x: number, y: number): [number, number] {
    const r2 = x * x + y * y
    if (r2 < 0.08 * 0.08) return [0, 0]
    // Bx = -I y / r² , By = I x / r²  ⇒ |B|=|I|/r
    return [(-I * y) / r2, (I * x) / r2]
  }

  function probeAt(time: number) {
    const omega = (2 * Math.PI) / period()
    const th = omega * time
    const x = R * Math.cos(th)
    const y = R * Math.sin(th)
    const [Bx, By] = fieldAt(x, y)
    const Bmag = Math.hypot(Bx, By)
    return { x, y, Bx, By, Bmag, th }
  }

  return {
    init(params: ParamValues) {
      I = Number(params.I ?? 2)
      R = Number(params.R ?? 2)
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
      const p = probeAt(t)
      const T = period()
      const BmagTheory = Math.abs(I) / Math.max(R, 1e-6)
      return {
        time: t,
        values: {
          I,
          R,
          x: p.x,
          y: p.y,
          Bx: p.Bx,
          By: p.By,
          Bmag: p.Bmag,
          BmagTheory,
          theta: (p.th * 180) / Math.PI,
          period: T,
          tMax: T,
          world: 4.5,
          sense: I >= 0 ? 1 : -1,
          done: t >= T - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.I !== undefined) I = Number(params.I)
      if (params.R !== undefined) R = Number(params.R)
    },
  }
}

export const wireBMeta: DemoMeta = {
  id: 'em-wire-b',
  subject: '电磁学',
  category: '电流磁场',
  tags: ['磁场', '毕奥-萨伐尔', '直导线'],
  model: 'wireB',
  adapter: 'wireB',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'I',
      label: '电流 I',
      kind: 'number',
      default: 2,
      min: -3,
      max: 3,
      step: 0.1,
      unit: 'A',
    },
    {
      key: 'R',
      label: '探测半径 R',
      kind: 'number',
      default: 2,
      min: 0.6,
      max: 3.5,
      step: 0.1,
      unit: 'm',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '磁场' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'Bmag',
      charts: [
        {
          id: 'Bcomp',
          title: '探测点磁场分量',
          xLabel: 't (s)',
          leftLabel: 'B',
          series: [
            { key: 'Bx', label: 'Bₓ', color: '#60a5fa', unit: 'u' },
            { key: 'By', label: 'Bᵧ', color: '#fbbf24', unit: 'u' },
            { key: 'Bmag', label: '|B|', color: '#34d399', unit: 'u' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'Bmag', label: '|B|', unit: 'u', tone: 'green' },
    { key: 'Bx', label: 'Bₓ', unit: 'u', tone: 'blue' },
    { key: 'By', label: 'Bᵧ', unit: 'u', tone: 'amber' },
    { key: 'I', label: 'I', unit: 'A', tone: 'purple' },
    { key: 'R', label: 'R', unit: 'm', tone: 'slate' },
  ],
  docs: {
    title: '无限长直导线磁场',
    summary:
      '导线沿 z（垂直纸面）穿过原点。B 线为同心圆；I>0 出纸面（·）时逆时针，I<0 入纸面（×）时顺时针。教学单位 |B|=|I|/r。',
    concept: [
      '毕奥–萨伐尔 / 安培环路：无限长直导线 |B|=μ₀ I /(2π r)。',
      '本演示取 μ₀/(2π)=1，故 |B|=|I|/r，方向由右手定则。',
      '磁力线闭合成圆，疏密大致反映 |B|∝1/r。',
    ],
    objectives: [
      '从圆线与箭头读出 B 的环绕方向',
      '验证 |B|∝1/R、∝|I|',
      '反转 I 观察方向反转',
    ],
    formulas: [
      'B=\\dfrac{\\mu_0 I}{2\\pi r}',
      '\\mu_0/(2\\pi)=1\\;(\\text{教学单位})\\Rightarrow |B|=|I|/r',
      '\\vec B \\perp \\vec r_{\\perp},\\;\\hat\\varphi\\text{ 右手定则}',
    ],
    insight:
      '青绿圆为 B 线；黄点为探测点。|B| 在圆周上恒定；改 R 或 |I| 看读数；I 变号则箭头反向。',
    legend: [
      { color: '#f87171', label: '导线截面（·/×）' },
      { color: '#34d399', label: '磁场线（带方向）' },
      { id: 'compare', color: '#f472b6', label: '探测圆' },
      { color: '#fbbf24', label: '探测点' },
    ],
    steps: [
      {
        id: 'ampere',
        title: '安培 / 毕奥–萨伐尔',
        body: '环绕直导线的磁场大小与电流成正比、与距离成反比。',
        formulas: ['|B|=|I|/r', '\\oint\\vec B\\cdot d\\vec\\ell=\\mu_0 I_{\\mathrm{enc}}'],
        bindings: [
          { labelTex: 'I', valueKey: 'I', unit: 'A' },
          { labelTex: 'R', valueKey: 'R', unit: 'm' },
          { labelTex: '|B|', valueKey: 'Bmag', unit: 'u' },
        ],
      },
      {
        id: 'probe',
        title: '探测点',
        body: '探测点在半径 R 的圆上运动；|B| 应近似恒定。',
        formulas: ['|B|=\\sqrt{B_x^2+B_y^2}'],
        bindings: [
          { labelTex: 'B_x', valueKey: 'Bx', unit: 'u' },
          { labelTex: 'B_y', valueKey: 'By', unit: 'u' },
          { labelTex: '|B|', valueKey: 'Bmag', unit: 'u' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'hand',
        title: '右手定则',
        body: '拇指沿电流（出/入纸面），四指环绕即 B 方向。',
        formulas: ['I>0\\Rightarrow\\text{逆时针}', 'I<0\\Rightarrow\\text{顺时针}'],
        bindings: [{ labelTex: 'I', valueKey: 'I', unit: 'A' }],
      },
    ],
    challenges: [
      {
        id: 'inverse-r',
        prompt: '取 I=2、R=2，使 |B|≈1（教学单位 I/R）。',
        hint: '|B|=|I|/R。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'I', target: 2, tol: 0.15 },
            { kind: 'paramNear', key: 'R', target: 2, tol: 0.15 },
            { kind: 'valueNear', key: 'Bmag', target: 1, tol: 0.08 },
          ],
        },
      },
      {
        id: 'reverse-I',
        prompt: '将 I 调为 −2（入纸面），仍保持 R=2，使 |B|≈1 且方向反转。',
        hint: '大小仍为 |I|/R，箭头应变为顺时针。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'I', target: -2, tol: 0.15 },
            { kind: 'paramNear', key: 'R', target: 2, tol: 0.15 },
            { kind: 'valueNear', key: 'Bmag', target: 1, tol: 0.08 },
          ],
        },
      },
    ],
  },
}

export function registerWireBDemo(): void {
  registerDemoBundle({
    meta: wireBMeta,
    model: createWireBModel,
    adapter: createWireBAdapter,
  })
}
