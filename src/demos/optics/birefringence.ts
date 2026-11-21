import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createBirefringenceAdapter } from './birefringenceAdapter'

/**
 * 单轴晶体板双折射（空气→晶体，教学简化）：
 *   o 光：n_o 服从斯涅尔  sin θᵢ = n_o sin θ_o
 *   e 光：用 n_e 近似折射角  sin θᵢ = n_e sin θ_e
 *   板厚 L 内横向分离 Δ = L (tan θ_e − tan θ_o)
 *   光轴在图面内，与界面法线夹角 γ（示意）
 *
 * 负单轴（方解石型）：n_e < n_o → |θ_e| > |θ_o|，e 光更「偏」。
 * 播放：入射角从近法线扫到较大角，观察双像分离。
 */
export function birefringenceState(
  thetaIDeg: number,
  nO: number,
  nE: number,
  L: number,
  gammaDeg: number,
): {
  thetaI: number
  thetaO: number
  thetaE: number
  yO: number
  yE: number
  deltaY: number
  gamma: number
  uniaxial: 'positive' | 'negative' | 'iso'
  label: string
} {
  const thetaI = Math.max(0, Math.min(70, thetaIDeg))
  const no = Math.max(1.01, nO)
  const ne = Math.max(1.01, nE)
  const LL = Math.max(0.2, L)
  const gamma = ((gammaDeg % 180) + 180) % 180

  const sI = Math.sin((thetaI * Math.PI) / 180)
  const sO = Math.min(0.999, sI / no)
  const sE = Math.min(0.999, sI / ne)
  const thetaO = (Math.asin(sO) * 180) / Math.PI
  const thetaE = (Math.asin(sE) * 180) / Math.PI
  const yO = LL * Math.tan((thetaO * Math.PI) / 180)
  const yE = LL * Math.tan((thetaE * Math.PI) / 180)
  const deltaY = yE - yO

  let uniaxial: 'positive' | 'negative' | 'iso' = 'iso'
  if (ne > no + 0.01) uniaxial = 'positive'
  else if (ne < no - 0.01) uniaxial = 'negative'

  const label =
    Math.abs(deltaY) < 0.02
      ? '几乎重合（近似各向同性）'
      : uniaxial === 'negative'
        ? '负单轴 · e 光偏折更大'
        : uniaxial === 'positive'
          ? '正单轴 · o 光偏折更大'
          : '双折射'

  return { thetaI, thetaO, thetaE, yO, yE, deltaY, gamma, uniaxial, label }
}

export function createBirefringenceModel(): PhysicsModel {
  let nO = 1.66
  let nE = 1.49
  let L = 3.2
  let gamma = 35
  let thetaMax = 55
  let t = 0
  const period = 8

  function thetaAt(time: number) {
    return (thetaMax * time) / period
  }

  return {
    init(params: ParamValues) {
      nO = Number(params.nO ?? 1.66)
      nE = Number(params.nE ?? 1.49)
      L = Number(params.L ?? 3.2)
      gamma = Number(params.gamma ?? 35)
      thetaMax = Number(params.thetaMax ?? 55)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const thetaI = thetaAt(t)
      const s = birefringenceState(thetaI, nO, nE, L, gamma)
      return {
        time: t,
        values: {
          nO,
          nE,
          L,
          gamma: s.gamma,
          thetaMax,
          thetaI: s.thetaI,
          thetaO: s.thetaO,
          thetaE: s.thetaE,
          yO: s.yO,
          yE: s.yE,
          deltaY: s.deltaY,
          absDelta: Math.abs(s.deltaY),
          uniaxial: s.uniaxial === 'negative' ? -1 : s.uniaxial === 'positive' ? 1 : 0,
          period,
          tMax: period,
          world: 7,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.nO !== undefined) nO = Number(params.nO)
      if (params.nE !== undefined) nE = Number(params.nE)
      if (params.L !== undefined) L = Number(params.L)
      if (params.gamma !== undefined) gamma = Number(params.gamma)
      if (params.thetaMax !== undefined) thetaMax = Number(params.thetaMax)
    },
  }
}

export const birefringenceMeta: DemoMeta = {
  id: 'opt-birefringence',
  subject: '光学',
  category: '偏振',
  tags: ['双折射', 'o光', 'e光', '单轴晶体'],
  model: 'birefringence',
  adapter: 'birefringence',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'nO',
      label: '寻常光 nₒ',
      kind: 'number',
      default: 1.66,
      min: 1.2,
      max: 2.2,
      step: 0.01,
      unit: '',
    },
    {
      key: 'nE',
      label: '非常光 nₑ',
      kind: 'number',
      default: 1.49,
      min: 1.2,
      max: 2.2,
      step: 0.01,
      unit: '',
    },
    {
      key: 'L',
      label: '板厚 L',
      kind: 'number',
      default: 3.2,
      min: 1.5,
      max: 5,
      step: 0.1,
      unit: 'u',
    },
    {
      key: 'gamma',
      label: '光轴角 γ',
      kind: 'number',
      default: 35,
      min: 0,
      max: 90,
      step: 5,
      unit: '°',
    },
    {
      key: 'thetaMax',
      label: '最大入射角',
      kind: 'number',
      default: 55,
      min: 20,
      max: 70,
      step: 5,
      unit: '°',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '双折射' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'deltaY',
      charts: [
        {
          id: 'split',
          title: '出射分离',
          xLabel: 't (s)',
          leftLabel: 'Δy / °',
          series: [
            { key: 'deltaY', label: 'Δy', color: '#a78bfa', unit: 'u' },
            { key: 'thetaO', label: 'θₒ', color: '#38bdf8', unit: '°' },
            { key: 'thetaE', label: 'θₑ', color: '#fbbf24', unit: '°' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'thetaI', label: 'θᵢ', unit: '°', tone: 'green' },
    { key: 'thetaO', label: 'θₒ', unit: '°', tone: 'blue' },
    { key: 'thetaE', label: 'θₑ', unit: '°', tone: 'amber' },
    { key: 'deltaY', label: 'Δy', unit: 'u', tone: 'purple' },
    { key: 'L', label: 'L', unit: 'u', tone: 'slate' },
  ],
  docs: {
    title: '双折射光路',
    summary:
      '单轴晶体中一束入射分成 o / e 两束：sinθᵢ=nₒsinθₒ、sinθᵢ=nₑsinθₑ。板内路径不同，出射侧向分离形成双像。',
    concept: [
      '寻常光 o：折射率恒为 nₒ，服从普通斯涅尔定律。',
      '非常光 e：折射率依赖方向；本演示用等效 nₑ 画折射角（教学近似）。',
      '方解石为负单轴（nₑ<nₒ）：同样入射下 e 光偏折更大。',
      '光轴 γ 标在晶体内，提醒各向异性方向；精确 walk-off 角留作进阶。',
    ],
    objectives: [
      '辨认青色 o 光与金色 e 光两条折射线',
      '对照 θₒ、θₑ 与斯涅尔代入',
      '改变 |nₒ−nₑ| 或 L 看分离 Δy',
    ],
    formulas: [
      '\\sin\\theta_i=n_o\\sin\\theta_o',
      '\\sin\\theta_i=n_e\\sin\\theta_e',
      '\\Delta y=L(\\tan\\theta_e-\\tan\\theta_o)',
    ],
    insight:
      '左侧入射，晶体内分叉为 o/e，右侧出射点分离 Δy。顶栏把两式斯涅尔与 Δy 代入当前角。',
    legend: [
      { color: '#4ade80', label: '入射' },
      { color: '#38bdf8', label: 'o 光（寻常）' },
      { color: '#fbbf24', label: 'e 光（非常）' },
      { color: '#a78bfa', label: '光轴示意' },
      { color: '#94a3b8', label: '晶体板' },
    ],
    steps: [
      {
        id: 'snell',
        title: '两套斯涅尔',
        body: '同一 θᵢ，分别用 nₒ、nₑ 求折射角。',
        formulas: ['\\sin\\theta_i=n_o\\sin\\theta_o', '\\sin\\theta_i=n_e\\sin\\theta_e'],
        bindings: [
          { labelTex: '\\theta_i', valueKey: 'thetaI', unit: '°' },
          { labelTex: '\\theta_o', valueKey: 'thetaO', unit: '°' },
          { labelTex: '\\theta_e', valueKey: 'thetaE', unit: '°' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'split',
        title: '横向分离',
        body: '板厚 L 内两束走不同斜率，出射间距 Δy。',
        formulas: ['\\Delta y=L(\\tan\\theta_e-\\tan\\theta_o)'],
        bindings: [
          { labelTex: 'L', valueKey: 'L', unit: 'u' },
          { labelTex: '\\Delta y', valueKey: 'deltaY', unit: 'u' },
        ],
      },
      {
        id: 'axis',
        title: '光轴',
        body: '虚线为光轴方向 γ；各向异性由光轴定义。',
        formulas: ['\\gamma'],
        bindings: [{ labelTex: '\\gamma', valueKey: 'gamma', unit: '°' }],
      },
    ],
    challenges: [
      {
        id: 'calcite',
        prompt: '保持方解石型默认（nₒ≈1.66，nₑ≈1.49），扫到 θᵢ≈40°，使 |Δy| 明显。',
        hint: '负单轴时 θₑ>θₒ，Δy>0。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'nO', target: 1.66, tol: 0.08 },
            { kind: 'paramNear', key: 'nE', target: 1.49, tol: 0.08 },
            { kind: 'valueNear', key: 'thetaI', target: 40, tol: 12 },
            { kind: 'valueNear', key: 'absDelta', target: 0.35, tol: 0.35 },
          ],
        },
      },
      {
        id: 'iso',
        prompt: '把 nₑ 调到接近 nₒ，使 |Δy|≈0（双像消失）。',
        hint: '两折射率相等时两束重合。',
        check: {
          kind: 'all',
          checks: [{ kind: 'valueNear', key: 'absDelta', target: 0, tol: 0.08 }],
        },
      },
    ],
  },
}

export function registerBirefringenceDemo(): void {
  registerDemoBundle({
    meta: birefringenceMeta,
    model: createBirefringenceModel,
    adapter: createBirefringenceAdapter,
  })
}
