import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createEntropyAdapter } from './entropyAdapter'

/** 自由膨胀示意：理想气体等温向真空膨胀，ΔS = nR ln(V2/V1)，ΔU=0 */
export function entropyChange(n: number, V1: number, V2: number): number {
  return Math.max(0.1, n) * Math.log(Math.max(0.2, V2) / Math.max(0.2, V1))
}

const N_PART = 28

export function createEntropyModel(): PhysicsModel {
  let n = 1
  let V1 = 1.2
  let V2 = 3.2
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      n = Number(params.n ?? 1)
      V1 = Number(params.V1 ?? 1.2)
      V2 = Number(params.V2 ?? 3.2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const u = t / period
      // 分段叙事：0–15% 隔板在；15–85% 膨胀；85–100% 混匀
      const mix = u < 0.12 ? 0 : u < 0.85 ? (u - 0.12) / 0.73 : 1
      const V = V1 + (V2 - V1) * mix
      const dS = entropyChange(n, V1, V)
      const dSFinal = entropyChange(n, V1, V2)
      const side = Math.sqrt(V)
      const phase =
        u < 0.12 ? 0 : u < 0.85 ? 1 : 2 // 0=初态 1=膨胀 2=终态

      const px = new Float32Array(N_PART)
      const py = new Float32Array(N_PART)
      // 世界坐标：左室 x∈[-2.2,-0.15]，右室 x∈[0.15,2.2]
      // 终态两室均匀铺满：约一半留左、一半到右（不是全跑右室）
      for (let i = 0; i < N_PART; i++) {
        const jitter = Math.sin(t * (1.4 + (i % 7) * 0.35) + i * 1.7) * 0.12
        const jy = Math.cos(t * (1.1 + (i % 5) * 0.4) + i * 2.1) * 0.15
        const xL = -2.05 + ((i * 0.31) % 1.7) + jitter * 0.5
        const xR = 0.25 + ((i * 0.37) % 1.8) + jitter * 0.5
        const y0 = -0.95 + ((i * 0.47) % 1.9) + jy
        // 偶数索引最终留在左室，奇数迁到右室
        const targetRight = i % 2 === 1
        // 迁移动画错开启动，避免齐步走
        const start = targetRight ? 0.05 + (i % 7) * 0.04 : 1.5 // 留左的几乎不迁
        const migrate = targetRight
          ? Math.min(1, Math.max(0, (mix - start) / Math.max(0.15, 0.85 - start)))
          : 0
        if (phase === 0 || mix < 0.02) {
          px[i] = xL
        } else if (targetRight) {
          px[i] = xL + (xR - xL) * migrate
        } else {
          // 留在左室，略微散开一点（密度下降的感觉）
          px[i] = xL
        }
        py[i] = y0
      }

      return {
        time: t,
        values: {
          n,
          V1,
          V2,
          V,
          dS,
          dSFinal,
          side,
          mix,
          phase,
          dU: 0,
          nPart: N_PART,
          px,
          py,
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
      if (params.V1 !== undefined) V1 = Number(params.V1)
      if (params.V2 !== undefined) V2 = Number(params.V2)
    },
  }
}

export const entropyMeta: DemoMeta = {
  id: 'thermo-entropy',
  subject: '热学',
  category: '熵与不可逆',
  tags: ['熵', '自由膨胀', '不可逆'],
  model: 'entropy',
  adapter: 'entropy',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'n', label: 'n', kind: 'number', default: 1, min: 0.5, max: 2, step: 0.1, unit: '' },
    { key: 'V1', label: '初体积 V₁', kind: 'number', default: 1.2, min: 0.6, max: 2, step: 0.1, unit: '' },
    { key: 'V2', label: '末体积 V₂', kind: 'number', default: 3.2, min: 1.5, max: 5, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '膨胀' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'ΔS',
      chartKey: 'dS',
      charts: [
        {
          id: 's',
          title: '熵变',
          xLabel: 't (s)',
          leftLabel: 'ΔS',
          series: [
            { key: 'dS', label: 'ΔS(t)', color: '#a78bfa', unit: '' },
            { key: 'dSFinal', label: 'ΔS终', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'V', label: 'V', unit: '', tone: 'blue' },
    { key: 'dS', label: 'ΔS', unit: '', tone: 'purple' },
    { key: 'dSFinal', label: 'ΔS终', unit: '', tone: 'amber' },
    { key: 'dU', label: 'ΔU', unit: '', tone: 'green' },
  ],
  docs: {
    title: '自由膨胀与熵增',
    summary:
      '理想气体等温向真空自由膨胀：W=0、Q=0、ΔU=0，但 ΔS=nR ln(V₂/V₁)>0。播放：隔板抽走 → 分子铺满 → 熵增。',
    concept: [
      '自由膨胀不对外做功，与热库无热交换',
      '内能不变，熵仍增加（不可逆）',
      '可及体积变大 → 微观态数↑ → 熵增',
    ],
    objectives: ['验证 ΔS=n ln(V₂/V₁)（R=1）', '确认 ΔU=0', '观察隔板抽走后分子铺满两室'],
    formulas: ['\\Delta S=nR\\ln(V_2/V_1)', '\\Delta U=0', 'Q=W=0'],
    insight: '三阶段：隔板在（有序）→ 膨胀中 → 混匀。紫条=ΔS 进度；金点=分子。',
    legend: [
      { color: '#38bdf8', label: '气体区域' },
      { color: '#a78bfa', label: 'ΔS' },
      { color: '#f87171', label: '隔板' },
      { color: '#fbbf24', label: '分子' },
    ],
    steps: [
      {
        id: 'ds',
        title: '熵变公式',
        body: '改变体积比，看 ΔS终；播放看分子扩散。',
        formulas: ['\\Delta S=n\\ln(V_2/V_1)'],
        bindings: [
          { labelTex: 'V_1', valueKey: 'V1', unit: '' },
          { labelTex: 'V_2', valueKey: 'V2', unit: '' },
          { labelTex: '\\Delta S', valueKey: 'dSFinal', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'ds-check',
        prompt: 'V₁=1.2、V₂=3.2、n=1，使 ΔS终≈ ln(3.2/1.2)。',
        hint: '约 0.98。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'V1', target: 1.2, tol: 0.15 },
            { kind: 'paramNear', key: 'V2', target: 3.2, tol: 0.2 },
            { kind: 'valueNear', key: 'dSFinal', target: Math.log(3.2 / 1.2), tol: 0.08 },
          ],
        },
      },
    ],
  },
}

export function registerEntropyDemo(): void {
  registerDemoBundle({
    meta: entropyMeta,
    model: createEntropyModel,
    adapter: createEntropyAdapter,
  })
}
