import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createDipoleRadiationAdapter } from './dipoleRadiationAdapter'

/** 远场偶极辐射功率角分布 ∝ sin²θ；瞬时场示意 E_θ ∝ sinθ cos(kr−ωt)/r */
export function dipolePattern(thetaDeg: number): number {
  const s = Math.sin((thetaDeg * Math.PI) / 180)
  return s * s
}

export function createDipoleRadiationModel(): PhysicsModel {
  let omega = 2.2
  let p0 = 1.2
  let t = 0
  const period = 8
  const N_RAYS = 36

  return {
    init(params: ParamValues) {
      omega = Number(params.omega ?? 2.2)
      p0 = Number(params.p0 ?? 1.2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const p = p0 * Math.cos(omega * t)
      const rays: number[][] = []
      for (let i = 0; i <= N_RAYS; i++) {
        const th = (180 * i) / N_RAYS // 0..180 from +z
        const amp = dipolePattern(th)
        const r = 0.4 + 2.4 * amp * (0.55 + 0.45 * Math.abs(Math.cos(omega * t)))
        const rad = (th * Math.PI) / 180
        // dipole along y; pattern in xy: θ from +y
        rays.push([r * Math.sin(rad), r * Math.cos(rad)])
      }
      // mirror left
      const left = rays
        .slice()
        .reverse()
        .map((p) => [-p[0]!, p[1]!])
      const lobe = [...left, ...rays]
      const eq = dipolePattern(90)
      return {
        time: t,
        values: {
          omega,
          p0,
          p,
          eq,
          powerEq: eq * p0 * p0,
          period,
          tMax: period,
          world: 3.5,
          done: t >= period - 1e-9 ? 1 : 0,
        },
        trails: { path: lobe },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.omega !== undefined) omega = Number(params.omega)
      if (params.p0 !== undefined) p0 = Number(params.p0)
    },
  }
}

export const dipoleRadiationMeta: DemoMeta = {
  id: 'em-dipole-radiation',
  subject: '电磁学',
  category: '电磁波',
  tags: ['偶极辐射', '远场'],
  model: 'dipoleRadiation',
  adapter: 'dipoleRadiation',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    { key: 'omega', label: 'ω', kind: 'number', default: 2.2, min: 0.8, max: 4, step: 0.2, unit: '' },
    { key: 'p0', label: 'p₀', kind: 'number', default: 1.2, min: 0.4, max: 2, step: 0.1, unit: '' },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '方向图' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'p(t)',
      chartKey: 'p',
      charts: [
        {
          id: 'p',
          title: '偶极矩',
          xLabel: 't (s)',
          leftLabel: 'p',
          series: [{ key: 'p', label: 'p(t)', color: '#fbbf24', unit: '' }],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'p', label: 'p', unit: '', tone: 'amber' },
    { key: 'eq', label: 'sin²θ(eq)', unit: '', tone: 'purple' },
    { key: 'omega', label: 'ω', unit: '', tone: 'blue' },
  ],
  docs: {
    title: '电偶极辐射示意',
    summary:
      '振荡电偶极远场功率角分布 ∝ sin²θ（θ 为相对偶极轴夹角）。赤道最强、轴向为零。花瓣随 p(t) 脉动。',
    concept: [
      '远场辐射功率 ∝ sin²θ',
      '轴向上无辐射（θ=0）',
      '赤道面最强',
    ],
    objectives: ['识别 sin²θ 花瓣', '观察轴向零辐射', '看振幅随振荡变化'],
    formulas: ['P(\\theta)\\propto\\sin^2\\theta', 'p(t)=p_0\\cos(\\omega t)'],
    insight: '金棒=偶极；紫轮廓=瞬时方向图。赤道最胖。',
    legend: [
      { color: '#fbbf24', label: '偶极' },
      { color: '#a78bfa', label: '方向图' },
    ],
    steps: [
      {
        id: 'null',
        title: '轴向零点',
        body: 'θ=0、180° 处幅度为零。',
        formulas: ['\\sin 0=0'],
        bindings: [{ labelTex: 'p', valueKey: 'p', unit: '' }],
      },
    ],
    challenges: [
      {
        id: 'pulse',
        prompt: '播放使 |p| 接近峰值。',
        hint: '看读数 p。',
        check: { kind: 'valueNear', key: 'p', target: 1.0, tol: 0.6 },
      },
    ],
  },
}

export function registerDipoleRadiationDemo(): void {
  registerDemoBundle({
    meta: dipoleRadiationMeta,
    model: createDipoleRadiationModel,
    adapter: createDipoleRadiationAdapter,
  })
}
