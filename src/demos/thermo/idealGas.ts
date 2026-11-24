import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createIdealGasAdapter } from './idealGasAdapter'

const NR = 1
const MAX_DOT = 36

export function idealPressure(n: number, T: number, V: number): number {
  return (Math.max(0.1, n) * NR * Math.max(0.1, T)) / Math.max(0.2, V)
}

/** 一维三角波折叠，模拟在 [-L, L] 内弹性反弹（周期 4L） */
function bounce1d(p0: number, v: number, t: number, half: number): number {
  const L = Math.max(0.05, half)
  const period = 4 * L
  // 先平移到 [0, 4L)，再折成 [0, 2L]，最后映到 [-L, L]
  let u = ((p0 + L + v * t) % period + period) % period
  if (u > 2 * L) u = period - u
  return u - L
}

export function createIdealGasModel(): PhysicsModel {
  let n = 1
  let T = 2
  let V = 2
  let t = 0
  const period = 6

  return {
    init(params: ParamValues) {
      n = Number(params.n ?? 1)
      T = Number(params.T ?? 2)
      V = Number(params.V ?? 2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const P = idealPressure(n, T, V)
      const side = Math.sqrt(Math.max(0.2, V))
      const half = side / 2
      const nDots = Math.min(MAX_DOT, Math.max(6, Math.round(n * 14)))
      const px = new Float32Array(nDots)
      const py = new Float32Array(nDots)
      const speed = 0.35 + Math.sqrt(Math.max(0.2, T)) * 0.85
      for (let i = 0; i < nDots; i++) {
        const ang = (i * 2.399963) % (Math.PI * 2)
        const vx = Math.cos(ang) * speed * (0.65 + (i % 5) * 0.08)
        const vy = Math.sin(ang) * speed * (0.65 + ((i + 3) % 5) * 0.08)
        const x0 = (((i * 0.37) % 1) - 0.5) * side * 0.55
        const y0 = (((i * 0.53) % 1) - 0.5) * side * 0.55
        px[i] = bounce1d(x0, vx, t, half * 0.85)
        py[i] = bounce1d(y0, vy, t, half * 0.85)
      }
      // 壁面碰撞闪烁：压强越大、温度越高越亮
      const wallPulse = 0.35 + 0.65 * Math.abs(Math.sin(t * (1.2 + Math.sqrt(T) * 1.8))) * Math.min(1.4, P)
      return {
        time: t,
        values: {
          n,
          T,
          V,
          P,
          side,
          PV: P * V,
          nRT: n * NR * T,
          residual: Math.abs(P * V - n * NR * T),
          nDots,
          px,
          py,
          wallPulse,
          period,
          tMax: period,
          world: 4,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.n !== undefined) n = Number(params.n)
      if (params.T !== undefined) T = Number(params.T)
      if (params.V !== undefined) V = Number(params.V)
    },
  }
}

export const idealGasMeta: DemoMeta = {
  id: 'thermo-ideal-gas',
  subject: '热学',
  category: '理想气体定律',
  tags: ['理想气体', 'PV=nRT', '状态方程'],
  model: 'idealGas',
  adapter: 'idealGas',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'n', label: '物质的量 n', kind: 'number', default: 1, min: 0.5, max: 2, step: 0.1, unit: '' },
    { key: 'T', label: '温度 T', kind: 'number', default: 2, min: 0.5, max: 4, step: 0.1, unit: '' },
    { key: 'V', label: '体积 V', kind: 'number', default: 2, min: 0.8, max: 5, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: 'P–V–T' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '对照',
      chartKey: 'P',
      charts: [
        {
          id: 'pv',
          title: 'PV 与 nRT',
          xLabel: 't (s)',
          leftLabel: '',
          series: [
            { key: 'PV', label: 'PV', color: '#38bdf8', unit: '' },
            { key: 'nRT', label: 'nRT', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'P', label: 'P', unit: '', tone: 'purple' },
    { key: 'V', label: 'V', unit: '', tone: 'blue' },
    { key: 'T', label: 'T', unit: '', tone: 'amber' },
    { key: 'residual', label: '|PV−nRT|', unit: '', tone: 'green' },
  ],
  docs: {
    title: '理想气体定律对照',
    summary:
      '调节 n、T、V，读出 P=nRT/V。播放时分子在盒内运动（速率∝√T），壁面冲量示意压强；顶栏对照 PV≡nRT。',
    concept: [
      '理想气体状态方程 PV=nRT',
      '等温时 P∝1/V；等容时 P∝T',
      '分子热运动速率随温度升高变快；碰撞更猛 → 压强更大',
    ],
    objectives: ['验证 PV=nRT', '观察 V 增大时 P 下降、框变大', '观察 T 升高时分子更快、P 上升'],
    formulas: ['PV=nRT', 'P=nRT/V', 'R=1\\ (\\text{教学})'],
    insight: '金框∝√V；粉箭头长度/数量∝P；播放看分子乱撞。调参后残差应≈0。',
    legend: [
      { color: '#fbbf24', label: '分子 / 体积框' },
      { color: '#38bdf8', label: 'PV' },
      { color: '#f472b6', label: '壁面压强' },
    ],
    steps: [
      {
        id: 'eq',
        title: '状态方程',
        body: '任意调参，残差保持≈0；播放看分子运动。',
        formulas: ['PV=nRT'],
        bindings: [
          { labelTex: 'PV', valueKey: 'PV', unit: '' },
          { labelTex: 'nRT', valueKey: 'nRT', unit: '' },
          { labelTex: '\\mathrm{res}', valueKey: 'residual', unit: '' },
        ],
      },
      {
        id: 'boyle',
        title: '等温压缩',
        body: '固定 T，减小 V，看框缩小、粉箭头变长、P 上升。',
        formulas: ['P\\propto 1/V'],
        bindings: [
          { labelTex: 'V', valueKey: 'V', unit: '' },
          { labelTex: 'P', valueKey: 'P', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'match',
        prompt: '取 n=1、T=2、V=2，使 P=1。',
        hint: 'P=nRT/V。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'V', target: 2, tol: 0.15 },
            { kind: 'valueNear', key: 'P', target: 1, tol: 0.08 },
          ],
        },
      },
    ],
  },
}

export function registerIdealGasDemo(): void {
  registerDemoBundle({
    meta: idealGasMeta,
    model: createIdealGasModel,
    adapter: createIdealGasAdapter,
  })
}
