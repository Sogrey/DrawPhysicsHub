import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createLensAdapter } from './lensAdapter'

/**
 * 薄透镜成像（会聚透镜，教材符号）：
 *   1/u + 1/v = 1/f  →  v = u f / (u − f)
 *   放大率 m = −v/u（负=倒立）
 * 物在左侧 u>0；v>0 实像在右，v<0 虚像在左；u→f 时像在无穷远。
 */
export function thinLens(u: number, f: number): {
  u: number
  f: number
  v: number
  m: number
  real: boolean
  finite: boolean
  caseCode: number
  caseLabel: string
} {
  const uu = Math.max(0.15, u)
  const ff = Math.max(0.2, f)
  const den = uu - ff
  const finite = Math.abs(den) > 1e-4
  const v = finite ? (uu * ff) / den : Number.POSITIVE_INFINITY
  const m = finite ? -v / uu : 0
  const real = finite && v > 0

  let caseCode = 0
  let caseLabel = ''
  if (!finite || Math.abs(uu - ff) < 0.08 * ff) {
    caseCode = 4
    caseLabel = 'u≈f · 像在无穷远'
  } else if (uu < ff) {
    caseCode = 5
    caseLabel = 'u<f · 虚像正立放大'
  } else if (Math.abs(uu - 2 * ff) < 0.1 * ff) {
    caseCode = 2
    caseLabel = 'u=2f · 实像倒立等大'
  } else if (uu > 2 * ff) {
    caseCode = 1
    caseLabel = 'u>2f · 实像倒立缩小'
  } else {
    caseCode = 3
    caseLabel = 'f<u<2f · 实像倒立放大'
  }

  return { u: uu, f: ff, v, m, real, finite, caseCode, caseLabel }
}

/**
 * 播放：物距从远到近扫过（约 3.2f → 0.55f），观察成像区域变化。
 */
export function createLensModel(): PhysicsModel {
  let f = 2
  let hObj = 1.2
  let t = 0
  const period = 10

  function uAt(time: number) {
    const uFar = 3.2 * f
    const uNear = 0.55 * f
    const frac = Math.min(1, Math.max(0, time / period))
    return uFar + (uNear - uFar) * frac
  }

  return {
    init(params: ParamValues) {
      f = Number(params.f ?? 2)
      hObj = Number(params.hObj ?? 1.2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const u = uAt(t)
      const s = thinLens(u, f)
      const hImg = s.finite ? s.m * hObj : 0
      return {
        time: t,
        values: {
          f,
          hObj,
          u: s.u,
          v: s.finite ? s.v : 0,
          m: s.m,
          hImg,
          real: s.real ? 1 : 0,
          finite: s.finite ? 1 : 0,
          caseCode: s.caseCode,
          period,
          tMax: period,
          world: Math.max(8, Math.abs(s.finite ? s.v : 0) + s.u + 2),
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.f !== undefined) f = Number(params.f)
      if (params.hObj !== undefined) hObj = Number(params.hObj)
    },
  }
}

export const lensMeta: DemoMeta = {
  id: 'opt-lens',
  subject: '光学',
  category: '几何光学',
  tags: ['透镜', '成像', '焦距', '光路'],
  model: 'lens',
  adapter: 'lens',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'f',
      label: '焦距 f',
      kind: 'number',
      default: 2,
      min: 1,
      max: 3.5,
      step: 0.1,
      unit: 'u',
    },
    {
      key: 'hObj',
      label: '物高 h',
      kind: 'number',
      default: 1.2,
      min: 0.5,
      max: 2,
      step: 0.1,
      unit: 'u',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '光路' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'v',
      charts: [
        {
          id: 'uv',
          title: '物距 / 像距',
          xLabel: 't (s)',
          leftLabel: '距离',
          series: [
            { key: 'u', label: 'u', color: '#4ade80', unit: 'u' },
            { key: 'v', label: 'v', color: '#38bdf8', unit: 'u' },
            { key: 'f', label: 'f', color: '#fbbf24', unit: 'u' },
          ],
        },
        {
          id: 'mag',
          title: '放大率',
          xLabel: 't (s)',
          leftLabel: 'm',
          series: [{ key: 'm', label: 'm', color: '#a78bfa', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'u', label: 'u', unit: 'u', tone: 'green' },
    { key: 'v', label: 'v', unit: 'u', tone: 'blue' },
    { key: 'm', label: 'm', unit: '', tone: 'purple' },
    { key: 'f', label: 'f', unit: 'u', tone: 'amber' },
    { key: 'hImg', label: '像高', unit: 'u', tone: 'slate' },
  ],
  docs: {
    title: '薄透镜成像',
    summary:
      '会聚薄透镜：1/u+1/v=1/f，m=−v/u。播放时物从远到近扫过，观察实像/虚像与三条特征光线。',
    concept: [
      '透镜公式 1/u+1/v=1/f（会聚 f>0，物距 u>0）。',
      '三条特征光线：平行→过像方焦点；过光心不偏折；过物方焦点→出射平行。',
      'u>f 得倒立实像；u<f 得正立虚像；u→f 像趋于无穷远。',
    ],
    objectives: [
      '对照光路图读出 u、v、焦点 F/F′',
      '在 u=2f 附近验证等大倒立',
      '拖到 u<f 观察虚像（虚线延长）',
    ],
    formulas: [
      '\\dfrac{1}{u}+\\dfrac{1}{v}=\\dfrac{1}{f}',
      'v=\\dfrac{u f}{u-f}',
      'm=-\\dfrac{v}{u}',
    ],
    insight:
      '绿箭头=物，蓝箭头=像；金点=焦点。实像用实线会聚，虚像用虚线反向延长。顶栏显示当前区域与公式代入。',
    legend: [
      { color: '#4ade80', label: '物 / 入射光线' },
      { color: '#38bdf8', label: '像 / 出射光线' },
      { color: '#fbbf24', label: '焦点 F / F′' },
      { color: '#a78bfa', label: '透镜' },
      { color: '#94a3b8', label: '主光轴' },
    ],
    steps: [
      {
        id: 'formula',
        title: '透镜公式',
        body: '已知物距 u、焦距 f，求像距 v。',
        formulas: ['1/u+1/v=1/f'],
        bindings: [
          { labelTex: 'u', valueKey: 'u', unit: 'u' },
          { labelTex: 'f', valueKey: 'f', unit: 'u' },
          { labelTex: 'v', valueKey: 'v', unit: 'u' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'mag',
        title: '放大率',
        body: '横向放大率 m=−v/u；|m|>1 放大，m<0 倒立。',
        formulas: ['m=-v/u'],
        bindings: [
          { labelTex: 'm', valueKey: 'm', unit: '' },
          { labelTex: 'h\'', valueKey: 'hImg', unit: 'u' },
        ],
      },
      {
        id: 'regions',
        title: '成像区域',
        body: 'u>2f 缩小实像；u=2f 等大；f<u<2f 放大实像；u<f 虚像。',
        formulas: ['v=uf/(u-f)'],
        bindings: [{ labelTex: 'u', valueKey: 'u', unit: 'u' }],
      },
    ],
    challenges: [
      {
        id: 'equal',
        prompt: '调到 u≈2f（可拖时间或改 f），使 |m|≈1 且为实像（real=1）。',
        hint: '默认 f=2 时 u≈4；播放到约 t=2.5s 附近。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'real', target: 1, tol: 0.2 },
            { kind: 'valueNear', key: 'm', target: -1, tol: 0.2 },
          ],
        },
      },
      {
        id: 'virtual',
        prompt: '拖到物在焦点以内（u<f），使 real=0（虚像）。',
        hint: '播放接近结束，或看顶栏「u<f」。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'real', target: 0, tol: 0.2 },
            { kind: 'valueNear', key: 'finite', target: 1, tol: 0.2 },
          ],
        },
      },
    ],
  },
}

export function registerLensDemo(): void {
  registerDemoBundle({
    meta: lensMeta,
    model: createLensModel,
    adapter: createLensAdapter,
  })
}
