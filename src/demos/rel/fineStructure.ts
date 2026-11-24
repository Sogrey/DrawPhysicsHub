import type { DemoMeta, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createFineStructureAdapter } from './fineStructureAdapter'

/** 氢精细结构修正示意：ΔE ∝ α² / n³ · f(j,l) 教学简化 */
export function fineShift(n: number, j: number, alpha = 1 / 137): number {
  const nn = Math.max(1, n)
  const jj = Math.max(0.5, j)
  return ((alpha * alpha) / (nn * nn * nn)) * (nn / (jj + 0.5) - 0.75)
}

export function createFineStructureModel(): PhysicsModel {
  let n = 2
  let t = 0
  const period = 8

  return {
    init(p: ParamValues) {
      n = Math.round(Number(p.n ?? 2))
      t = 0
    },
    step(dt) {
      t = Math.min(period, t + dt)
    },
    seek(time) {
      t = Math.min(period, Math.max(0, time))
    },
    observe() {
      const nn = Math.min(4, Math.max(2, n))
      const jLo = Math.max(0.5, nn - 1.5)
      const jHi = nn - 0.5
      const dLo = fineShift(nn, jLo)
      const dHi = fineShift(nn, jHi)
      const split = Math.abs(dHi - dLo)
      const blend = t / period
      // 教学放大：真实分裂 ~α²，画面上用可见间距展示相对大小（∝1/n³）
      const vis = 0.28 * (8 / (nn * nn * nn))
      const yCoarse = -0.55
      const yLo = yCoarse - vis * blend
      const yHi = yCoarse + vis * blend
      const levels: number[][] = [
        [0, yCoarse],
        [-0.55, yLo],
        [0.55, yHi],
      ]
      return {
        time: t,
        values: {
          n: nn,
          dLo,
          dHi,
          split,
          blend,
          yCoarse,
          yLo,
          yHi,
          vis,
          period,
          tMax: period,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: levels },
      }
    },
    reset() {
      t = 0
    },
    setParams(p) {
      if (p.n !== undefined) n = Math.round(Number(p.n))
    },
  }
}

export const fineStructureMeta: DemoMeta = {
  id: 'atom-fine-structure',
  subject: '近代物理',
  category: '原子光谱',
  tags: ['精细结构', '自旋轨道'],
  model: 'fineStructure',
  adapter: 'fineStructure',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [{ key: 'n', label: '主量子数 n', kind: 'number', default: 2, min: 2, max: 4, step: 1, unit: '' }],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '精细结构' },
    { id: 'scene3d', kind: 'three', title: '3D' },
    {
      id: 'chart',
      kind: 'chart',
      title: '分裂',
      chartKey: 'split',
      charts: [
        {
          id: 's',
          title: '分裂间距',
          xLabel: 't',
          leftLabel: 'Δ',
          series: [
            { key: 'split', label: '真实 split', color: '#fbbf24', unit: '' },
            { key: 'blend', label: '张开进度', color: '#a78bfa', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'n', label: 'n', unit: '', tone: 'slate' },
    { key: 'split', label: '分裂', unit: '', tone: 'amber' },
    { key: 'blend', label: '张开', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '精细结构分裂示意',
    summary: '自旋-轨道耦合使同一 n 的能级按 j 分裂，量级 ~α²。播放看能级张开。',
    concept: ['精细结构常数', '自旋轨道', 'j 分裂'],
    objectives: ['切换 n', '播放观察双线劈裂', '对照分裂间距'],
    formulas: ['\\Delta E\\sim \\alpha^2/n^3'],
    insight: '中间粗能级→左右精细子能级（画面间距已教学放大）。',
    legend: [
      { color: '#94a3b8', label: '粗能级' },
      { color: '#fbbf24', label: '精细' },
    ],
    steps: [
      {
        id: 'n',
        title: 'n',
        body: '增大 n 看分裂变小；播放看张开。',
        formulas: ['\\Delta E'],
        bindings: [{ labelTex: 'split', valueKey: 'split', unit: '' }],
      },
    ],
    challenges: [
      {
        id: 'n4',
        prompt: '取 n=4。',
        hint: '调主量子数。',
        check: { kind: 'paramNear', key: 'n', target: 4, tol: 0.5 },
      },
    ],
  },
}

export function registerFineStructureDemo() {
  registerDemoBundle({
    meta: fineStructureMeta,
    model: createFineStructureModel,
    adapter: createFineStructureAdapter,
  })
}
