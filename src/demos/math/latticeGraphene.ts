import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createLatticeGrapheneAdapter } from './latticeGrapheneAdapter'

/** 石墨烯电子色散示意（最近邻紧束缚）：E=±t √(3+2cos… ) 简化为 K 点附近线性锥 */
export function grapheneDirac(q: number, vf: number): { Ep: number; Em: number } {
  const E = vf * Math.abs(q)
  return { Ep: E, Em: -E }
}

/** 六角格点（示意，单胞平移） */
export function hexLatticePoints(scale: number): number[][] {
  const pts: number[][] = []
  const a = scale
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const x = a * (1.5 * i)
      const y = a * ((Math.sqrt(3) / 2) * i + Math.sqrt(3) * j)
      pts.push([x, y, 0]) // A
      pts.push([x + a, y, 1]) // B
    }
  }
  return pts
}

export function createLatticeGrapheneModel(): PhysicsModel {
  let vf = 1.2
  let amp = 0.15
  let t = 0
  const period = 8

  return {
    init(params: ParamValues) {
      vf = Number(params.vf ?? 1.2)
      amp = Number(params.amp ?? 0.15)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const qMax = 1.8
      const q = -qMax + (2 * qMax * t) / period
      const d = grapheneDirac(q, vf)
      const cone: number[][] = []
      for (let i = 0; i <= 40; i++) {
        const qq = -qMax + (2 * qMax * i) / 40
        const dd = grapheneDirac(qq, vf)
        cone.push([qq, dd.Ep], [qq, dd.Em])
      }
      const base = hexLatticePoints(0.85)
      const atoms = base.map((p) => {
        const breath = amp * Math.sin(2.2 * t + (p[0]! + p[1]!) * 0.8)
        const s = 1 + (p[2] === 0 ? breath : -breath)
        return [p[0]! * s * 0.15 + p[0]! * 0.85, p[1]! * s * 0.15 + p[1]! * 0.85, p[2]!]
      })
      return {
        time: t,
        values: {
          vf,
          amp,
          q,
          Ep: d.Ep,
          Em: d.Em,
          gap: 0,
          period,
          tMax: period,
          world: 4,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: atoms, cone },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.vf !== undefined) vf = Number(params.vf)
      if (params.amp !== undefined) amp = Number(params.amp)
    },
  }
}

export const latticeGrapheneMeta: DemoMeta = {
  id: 'lattice-graphene',
  subject: '数理方法',
  category: '晶格振动',
  tags: ['石墨烯', '声子'],
  model: 'latticeGraphene',
  adapter: 'latticeGraphene',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'vf', label: '费米速 v_F', kind: 'number', default: 1.2, min: 0.6, max: 2, step: 0.1, unit: '' },
    { key: 'amp', label: '光学模振幅', kind: 'number', default: 0.15, min: 0.05, max: 0.3, step: 0.05, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '格点+Dirac' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '锥',
      chartKey: 'Ep',
      charts: [
        {
          id: 'dirac',
          title: 'Dirac 锥截面',
          xLabel: 't (s)',
          leftLabel: 'E',
          series: [
            { key: 'Ep', label: 'E+', color: '#fbbf24', unit: '' },
            { key: 'Em', label: 'E−', color: '#a78bfa', unit: '' },
            { key: 'q', label: 'q', color: '#38bdf8', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'q', label: 'q', unit: '', tone: 'blue' },
    { key: 'Ep', label: 'E+', unit: '', tone: 'amber' },
    { key: 'vf', label: 'v_F', unit: '', tone: 'purple' },
  ],
  docs: {
    title: '石墨烯振动 / Dirac 示意',
    summary:
      '六角蜂窝格点 + K 点附近线性色散 E=±v_F|q|（Dirac 锥截面）。格点上示意光学支式呼吸/反相位移。教学简化，非完整声子谱。',
    concept: [
      '蜂窝格：两套子晶格 A/B',
      'Dirac 点线性色散',
      '光学模：A/B 反相',
    ],
    objectives: ['辨认六角格', '观察线性锥 E∝|q|', '看子晶格反相振动'],
    formulas: ['E=\\pm v_F |q|', '\\text{Dirac cone}'],
    insight: '左/中：蜂窝；右下：Dirac 截面。金/紫=导带/价带。',
    legend: [
      { color: '#38bdf8', label: 'A 位' },
      { color: '#f472b6', label: 'B 位' },
      { color: '#fbbf24', label: 'E+' },
    ],
    steps: [
      {
        id: 'linear',
        title: '线性',
        body: '扫 q，看 |E|∝|q|。',
        formulas: ['|E|=v_F|q|'],
        bindings: [
          { labelTex: 'E_+', valueKey: 'Ep', unit: '' },
          { labelTex: 'q', valueKey: 'q', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'cone',
        prompt: '播放使 |q| 较大且 |E+| 明显。',
        hint: '拖到两端。',
        check: { kind: 'valueNear', key: 'Ep', target: 1.5, tol: 1.2 },
      },
    ],
  },
}

export function registerLatticeGrapheneDemo(): void {
  registerDemoBundle({
    meta: latticeGrapheneMeta,
    model: createLatticeGrapheneModel,
    adapter: createLatticeGrapheneAdapter,
  })
}
