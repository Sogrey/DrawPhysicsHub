import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createComplexSurfAdapter } from './complexSurfAdapter'

/** f(z)=z² 或 1/z：返回 |f|、arg */
export function complexF(
  x: number,
  y: number,
  kind: number,
): { mod: number; arg: number; u: number; v: number } {
  if (kind >= 1.5) {
    // 1/z
    const r2 = x * x + y * y
    if (r2 < 1e-6) return { mod: 8, arg: 0, u: 0, v: 0 }
    const u = x / r2
    const v = -y / r2
    return { mod: Math.hypot(u, v), arg: Math.atan2(v, u), u, v }
  }
  // z²
  const u = x * x - y * y
  const v = 2 * x * y
  return { mod: Math.hypot(u, v), arg: Math.atan2(v, u), u, v }
}

export function createComplexSurfModel(): PhysicsModel {
  let kind = 1 // 1=z², 2=1/z
  let t = 0
  const period = 8
  const N = 24

  return {
    init(params: ParamValues) {
      kind = Number(params.kind ?? 1)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const phase = (2 * Math.PI * t) / period
      const samples: number[][] = []
      for (let i = 0; i <= N; i++) {
        for (let j = 0; j <= N; j++) {
          const x = -2 + (4 * i) / N
          const y = -2 + (4 * j) / N
          const f = complexF(x, y, kind)
          samples.push([x, y, Math.min(4, f.mod), f.arg])
        }
      }
      const probe = complexF(1.2 * Math.cos(phase), 1.2 * Math.sin(phase), kind)
      return {
        time: t,
        values: {
          kind,
          mod: probe.mod,
          argDeg: (probe.arg * 180) / Math.PI,
          u: probe.u,
          v: probe.v,
          px: 1.2 * Math.cos(phase),
          py: 1.2 * Math.sin(phase),
          period,
          tMax: period,
          world: 3,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: samples },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.kind !== undefined) kind = Number(params.kind)
    },
  }
}

export const complexSurfMeta: DemoMeta = {
  id: 'math-complex-surf',
  subject: '数理方法',
  category: '复变可视化',
  tags: ['复变', '模与辐角'],
  model: 'complexSurf',
  adapter: 'complexSurf',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'kind', label: '函数（1=z², 2=1/z）', kind: 'number', default: 1, min: 1, max: 2, step: 1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '|f| 热图' },
    { id: 'scene3d', kind: 'three', title: '|f| 曲面' },
    {
      id: 'chart',
      kind: 'chart',
      title: '探针',
      chartKey: 'mod',
      charts: [
        {
          id: 'mod',
          title: '圆周探针',
          xLabel: 't (s)',
          leftLabel: '|f|',
          series: [
            { key: 'mod', label: '|f|', color: '#fbbf24', unit: '' },
            { key: 'argDeg', label: 'arg°', color: '#a78bfa', unit: '°' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'mod', label: '|f|', unit: '', tone: 'amber' },
    { key: 'argDeg', label: 'arg', unit: '°', tone: 'purple' },
    { key: 'kind', label: 'kind', unit: '', tone: 'blue' },
  ],
  docs: {
    title: '复函数曲面示意',
    summary:
      '在复平面上显示 |f(z)| 与辐角色相。z²：零点阶 2；1/z：原点极点。探针沿圆周运动读 |f|、arg。',
    concept: [
      '|f| = 模，arg = 辐角',
      'z² 在 0 为二阶零点',
      '1/z 在 0 为极点',
    ],
    objectives: ['区分零点与极点形貌', '观察辐角绕行', '对照两种 f'],
    formulas: ['f(z)=z^2', 'f(z)=1/z', '|f|=\\sqrt{u^2+v^2}'],
    insight: '亮度∝|f|；色相∝arg。金点=探针。',
    legend: [
      { color: '#fbbf24', label: '探针' },
      { color: '#38bdf8', label: '|f| 低' },
      { color: '#f472b6', label: '|f| 高 / 极点' },
    ],
    steps: [
      {
        id: 'pole',
        title: '极点',
        body: 'kind=2，看原点附近 |f| 飙升。',
        formulas: ['|1/z|\\to\\infty'],
        bindings: [
          { labelTex: '|f|', valueKey: 'mod', unit: '' },
          { labelTex: '\\mathrm{kind}', valueKey: 'kind', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'z2',
        prompt: '取 kind=1（z²），播放一周。',
        hint: '默认即可。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'kind', target: 1, tol: 0.5 },
            { kind: 'valueNear', key: 't', target: 3, tol: 6 },
          ],
        },
      },
    ],
  },
}

export function registerComplexSurfDemo(): void {
  registerDemoBundle({
    meta: complexSurfMeta,
    model: createComplexSurfModel,
    adapter: createComplexSurfAdapter,
  })
}
