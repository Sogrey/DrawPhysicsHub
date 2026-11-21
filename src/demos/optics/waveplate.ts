import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createWaveplateAdapter } from './waveplateAdapter'

/** 复数组元 [re, im] */
type C = readonly [number, number]

function cMul(a: C, b: C): C {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
}

function cAbs(a: C): number {
  return Math.hypot(a[0], a[1])
}

function cArg(a: C): number {
  return Math.atan2(a[1], a[0])
}

/**
 * 线偏光经波片（Jones）：
 *   J_in = [cos α, sin α]
 *   M = R(−β) diag(1, e^{iδ}) R(β)
 * 快轴相对慢轴位相延迟 δ（λ/4→π/2，λ/2→π）。
 */
export function applyWaveplate(
  alphaDeg: number,
  betaDeg: number,
  deltaDeg: number,
): { jx: C; jy: C } {
  const a = (alphaDeg * Math.PI) / 180
  const b = (betaDeg * Math.PI) / 180
  const d = (deltaDeg * Math.PI) / 180
  const cin: C = [Math.cos(a), 0]
  const cinY: C = [Math.sin(a), 0]
  const cb = Math.cos(b)
  const sb = Math.sin(b)
  // R(−β) J
  const fx: C = [cb * cin[0] + sb * cinY[0], cb * cin[1] + sb * cinY[1]]
  const fy: C = [-sb * cin[0] + cb * cinY[0], -sb * cin[1] + cb * cinY[1]]
  // diag(1, e^{iδ})
  const eDelta: C = [Math.cos(d), Math.sin(d)]
  const fy2 = cMul(fy, eDelta)
  // R(β) …
  const jx: C = [cb * fx[0] - sb * fy2[0], cb * fx[1] - sb * fy2[1]]
  const jy: C = [sb * fx[0] + cb * fy2[0], sb * fx[1] + cb * fy2[1]]
  return { jx, jy }
}

/** 瞬时电场（约定 E = Re{J e^{-iωt}}） */
export function fieldAt(jx: C, jy: C, omegaT: number): { ex: number; ey: number } {
  const c = Math.cos(omegaT)
  const s = Math.sin(omegaT)
  return {
    ex: jx[0] * c + jx[1] * s,
    ey: jy[0] * c + jy[1] * s,
  }
}

export type PolKind = 'linear' | 'circular' | 'elliptical'

export function classifyPolarization(jx: C, jy: C): {
  kind: PolKind
  label: string
  Ax: number
  Ay: number
  dphi: number
  ellipticity: number
} {
  const Ax = cAbs(jx)
  const Ay = cAbs(jy)
  let dphi = cArg(jy) - cArg(jx)
  while (dphi > Math.PI) dphi -= 2 * Math.PI
  while (dphi < -Math.PI) dphi += 2 * Math.PI
  const absD = Math.abs(dphi)
  const ampEq = Math.abs(Ax - Ay) < 0.06 && Ax > 0.05 && Ay > 0.05
  const phase0 = absD < 0.12 || Math.abs(absD - Math.PI) < 0.12
  const phase90 = Math.abs(absD - Math.PI / 2) < 0.12
  let kind: PolKind = 'elliptical'
  let label = '椭圆偏振'
  if (Ax < 0.05 || Ay < 0.05 || phase0) {
    kind = 'linear'
    label = '线偏振'
  } else if (ampEq && phase90) {
    kind = 'circular'
    label = dphi > 0 ? '左旋圆偏振' : '右旋圆偏振'
  }
  const ellipticity = Ax + Ay < 1e-9 ? 0 : Math.min(Ax, Ay) / Math.max(Ax, Ay)
  return { kind, label, Ax, Ay, dphi, ellipticity }
}

/**
 * 波片与偏振态：播放扫过一个光周期，画出出射端电场矢端轨迹（线/圆/椭圆）。
 */
export function createWaveplateModel(): PhysicsModel {
  let alpha = 45
  let beta = 0
  let delta = 90 // degrees retardance
  let plate = 'quarter' // quarter | half | custom
  let t = 0
  const period = 4 // one optical cycle (arbitrary units for scrub)

  function resolveDelta(): number {
    if (plate === 'quarter') return 90
    if (plate === 'half') return 180
    return delta
  }

  function stateAt(time: number) {
    const dlt = resolveDelta()
    const { jx, jy } = applyWaveplate(alpha, beta, dlt)
    const pol = classifyPolarization(jx, jy)
    const omegaT = (2 * Math.PI * time) / period
    const { ex, ey } = fieldAt(jx, jy, omegaT)
    const ain = (alpha * Math.PI) / 180
    return {
      dlt,
      jx,
      jy,
      pol,
      omegaT,
      ex,
      ey,
      exIn: Math.cos(ain) * Math.cos(omegaT),
      eyIn: Math.sin(ain) * Math.cos(omegaT),
    }
  }

  return {
    init(params: ParamValues) {
      alpha = Number(params.alpha ?? 45)
      beta = Number(params.beta ?? 0)
      delta = Number(params.delta ?? 90)
      plate = String(params.plate ?? 'quarter')
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const s = stateAt(t)
      return {
        time: t,
        values: {
          alpha,
          beta,
          delta: s.dlt,
          plate: plate === 'half' ? 2 : plate === 'custom' ? 0 : 1,
          Ax: s.pol.Ax,
          Ay: s.pol.Ay,
          dphi: (s.pol.dphi * 180) / Math.PI,
          ellipticity: s.pol.ellipticity,
          kindCode: s.pol.kind === 'linear' ? 0 : s.pol.kind === 'circular' ? 2 : 1,
          Ex: s.ex,
          Ey: s.ey,
          ExIn: s.exIn,
          EyIn: s.eyIn,
          jxRe: s.jx[0],
          jxIm: s.jx[1],
          jyRe: s.jy[0],
          jyIm: s.jy[1],
          period,
          tMax: period,
          world: 6,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.alpha !== undefined) alpha = Number(params.alpha)
      if (params.beta !== undefined) beta = Number(params.beta)
      if (params.delta !== undefined) delta = Number(params.delta)
      if (params.plate !== undefined) plate = String(params.plate)
    },
  }
}

export const waveplateMeta: DemoMeta = {
  id: 'opt-waveplate',
  subject: '光学',
  category: '偏振',
  tags: ['波片', '偏振', '圆偏振', '椭圆', 'Jones'],
  model: 'waveplate',
  adapter: 'waveplate',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'plate',
      label: '波片类型',
      kind: 'select',
      default: 'quarter',
      options: [
        { value: 'quarter', label: '1/4 波片 (δ=90°)' },
        { value: 'half', label: '1/2 波片 (δ=180°)' },
        { value: 'custom', label: '自定义延迟 δ' },
      ],
    },
    {
      key: 'alpha',
      label: '入射线偏光 α',
      kind: 'number',
      default: 45,
      min: -90,
      max: 90,
      step: 5,
      unit: '°',
    },
    {
      key: 'beta',
      label: '快轴方位 β',
      kind: 'number',
      default: 0,
      min: -90,
      max: 90,
      step: 5,
      unit: '°',
    },
    {
      key: 'delta',
      label: '延迟 δ（自定义）',
      kind: 'number',
      default: 90,
      min: 0,
      max: 360,
      step: 5,
      unit: '°',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '偏振态' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'Ex',
      charts: [
        {
          id: 'field',
          title: '出射电场分量',
          xLabel: 't',
          leftLabel: 'E',
          series: [
            { key: 'Ex', label: 'Ex', color: '#38bdf8', unit: '' },
            { key: 'Ey', label: 'Ey', color: '#4ade80', unit: '' },
          ],
        },
        {
          id: 'phase',
          title: '相对位相',
          xLabel: 't',
          leftLabel: '°',
          series: [{ key: 'dphi', label: 'Δφ', color: '#a78bfa', unit: '°' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'delta', label: 'δ', unit: '°', tone: 'purple' },
    { key: 'dphi', label: 'Δφ', unit: '°', tone: 'amber' },
    { key: 'Ax', label: 'Ax', unit: '', tone: 'blue' },
    { key: 'Ay', label: 'Ay', unit: '', tone: 'green' },
    { key: 'ellipticity', label: 'ε', unit: '', tone: 'slate' },
  ],
  docs: {
    title: '波片与偏振态（线 / 圆 / 椭圆）',
    summary:
      '线偏光经波片后，快慢轴分量产生相对位相延迟 δ。播放一个光周期，矢端轨迹画出线、圆或椭圆偏振。',
    concept: [
      '波片不吸收振幅，只在快/慢轴间引入延迟 δ。',
      '1/4 波片 + 45° 入射线偏光 → 圆偏振；偏离 45° → 椭圆。',
      '1/2 波片保持线偏振，但把偏振面转到 α′=2β−α。',
    ],
    objectives: [
      '对照矢端轨迹判断线 / 圆 / 椭圆',
      '调 α、β 看 λ/4 何时成圆',
      '用 λ/2 验证偏振面旋转 2β−α',
    ],
    formulas: [
      'J_{\\mathrm{in}}=(\\cos\\alpha,\\sin\\alpha)',
      'M=R(-\\beta)\\,\\mathrm{diag}(1,e^{i\\delta})\\,R(\\beta)',
      '\\delta_{\\lambda/4}=\\pi/2,\\quad \\delta_{\\lambda/2}=\\pi',
      '\\alpha\'=2\\beta-\\alpha\\quad(\\lambda/2)',
    ],
    insight:
      '左侧入射线偏光双箭头 → 中间波片（快/慢轴）→ 右侧矢端扫出偏振轨迹；播放即「形成过程」。',
    legend: [
      { color: '#4ade80', label: '入射线偏光' },
      { color: '#fbbf24', label: '快轴' },
      { color: '#f472b6', label: '慢轴' },
      { color: '#38bdf8', label: '出射矢端轨迹' },
      { color: '#a78bfa', label: '瞬时 E' },
    ],
    steps: [
      {
        id: 'input',
        title: '入射',
        body: '线偏光方位角 α；振幅分量沿 x、y 分别为 cosα、sinα。',
        formulas: ['J_{\\mathrm{in}}=(\\cos\\alpha,\\sin\\alpha)'],
        bindings: [{ labelTex: '\\alpha', valueKey: 'alpha', unit: '°' }],
      },
      {
        id: 'retard',
        title: '延迟',
        body: '快轴方位 β；慢轴相对快轴相位延迟 δ。',
        formulas: ['M=R(-\\beta)\\,\\mathrm{diag}(1,e^{i\\delta})\\,R(\\beta)'],
        bindings: [
          { labelTex: '\\beta', valueKey: 'beta', unit: '°' },
          { labelTex: '\\delta', valueKey: 'delta', unit: '°' },
          { labelTex: '\\Delta\\varphi', valueKey: 'dphi', unit: '°' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'state',
        title: '偏振态',
        body: '振幅比与 Δφ 决定轨迹：同相→线；等幅且 Δφ=±90°→圆；其余→椭圆。',
        formulas: ['E_x=\\mathrm{Re}\\{J_x e^{-i\\omega t}\\}'],
        bindings: [
          { labelTex: 'A_x', valueKey: 'Ax', unit: '' },
          { labelTex: 'A_y', valueKey: 'Ay', unit: '' },
          { labelTex: '\\varepsilon', valueKey: 'ellipticity', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'circular',
        prompt: '用 1/4 波片，调到圆偏振（|α−β|≈45°，ε≈1）。',
        hint: 'plate=1/4，α=45°、β=0°（或等价差 45°）。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'alpha', target: 45, tol: 8 },
            { kind: 'paramNear', key: 'beta', target: 0, tol: 8 },
            { kind: 'valueNear', key: 'ellipticity', target: 1, tol: 0.12 },
            { kind: 'valueNear', key: 'kindCode', target: 2, tol: 0.5 },
          ],
        },
      },
      {
        id: 'half-rotate',
        prompt: '用 1/2 波片、β=45°、α=0°，使出射仍为线偏光且接近竖直（|Δφ|≈0 或 180，Ay≫Ax）。',
        hint: '半波片：α′=2β−α=90°。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'delta', target: 180, tol: 5 },
            { kind: 'paramNear', key: 'beta', target: 45, tol: 8 },
            { kind: 'paramNear', key: 'alpha', target: 0, tol: 8 },
            { kind: 'valueNear', key: 'kindCode', target: 0, tol: 0.5 },
            { kind: 'valueNear', key: 'Ay', target: 1, tol: 0.15 },
          ],
        },
      },
    ],
  },
}

export function registerWaveplateDemo(): void {
  registerDemoBundle({
    meta: waveplateMeta,
    model: createWaveplateModel,
    adapter: createWaveplateAdapter,
  })
}
