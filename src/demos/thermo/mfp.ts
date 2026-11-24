import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createMfpAdapter } from './mfpAdapter'

const MAX_N = 48

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  trail: number[]
  pathLen: number
}

/** 二维硬圆平均自由程：λ = 1 / (2√2 · n · d) ，n=面密度，d=直径 */
export function mfpTheory2d(n: number, diameter: number): number {
  const dens = Math.max(1e-6, n)
  const d = Math.max(0.02, diameter)
  return 1 / (2 * Math.SQRT2 * dens * d)
}

/**
 * 平均自由程示意：稀薄气体粒子碰撞；统计段长均值对照理论 λ。
 */
export function createMfpModel(): PhysicsModel {
  let N = 24
  let T = 1.2
  let diameter = 0.22
  let boxW = 7
  let boxH = 5
  let t = 0
  const period = 12
  let particles: Particle[] = []
  let collisions = 0
  let pathSum = 0
  let pathCount = 0
  let lastHitX = 0
  let lastHitY = 0
  let hitFlash = 0

  function speedScale() {
    return Math.sqrt(Math.max(0.2, T)) * 2.0
  }

  function seed() {
    particles = []
    const sp = speedScale()
    const margin = diameter
    for (let i = 0; i < N; i++) {
      const ang = Math.random() * Math.PI * 2
      const speed = sp * (0.7 + Math.random() * 0.6)
      particles.push({
        x: -boxW / 2 + margin + Math.random() * (boxW - 2 * margin),
        y: -boxH / 2 + margin + Math.random() * (boxH - 2 * margin),
        vx: speed * Math.cos(ang),
        vy: speed * Math.sin(ang),
        trail: [],
        pathLen: 0,
      })
    }
    collisions = 0
    pathSum = 0
    pathCount = 0
    hitFlash = 0
  }

  function areaDensity() {
    return N / Math.max(0.1, boxW * boxH)
  }

  function collidePair(a: Particle, b: Particle) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy)
    const minD = diameter
    if (dist >= minD || dist < 1e-9) return false
    // separate
    const nx = dx / dist
    const ny = dy / dist
    const overlap = minD - dist
    a.x -= nx * overlap * 0.5
    a.y -= ny * overlap * 0.5
    b.x += nx * overlap * 0.5
    b.y += ny * overlap * 0.5
    // elastic exchange along normal
    const dvx = a.vx - b.vx
    const dvy = a.vy - b.vy
    const vn = dvx * nx + dvy * ny
    if (vn > 0) return false
    a.vx -= vn * nx
    a.vy -= vn * ny
    b.vx += vn * nx
    b.vy += vn * ny
    // free-path stats
    pathSum += a.pathLen + b.pathLen
    pathCount += 2
    a.pathLen = 0
    b.pathLen = 0
    a.trail = []
    b.trail = []
    lastHitX = (a.x + b.x) / 2
    lastHitY = (a.y + b.y) / 2
    hitFlash = 1
    collisions += 1
    return true
  }

  function integrate(dt: number) {
    const sub = Math.max(1, Math.ceil(dt / 0.008))
    const h = dt / sub
    for (let s = 0; s < sub; s++) {
      for (const p of particles) {
        const step = Math.hypot(p.vx, p.vy) * h
        p.x += p.vx * h
        p.y += p.vy * h
        p.pathLen += step
        p.trail.push(p.x, p.y)
        if (p.trail.length > 40) p.trail.splice(0, p.trail.length - 40)

        const hx = boxW / 2 - diameter * 0.5
        const hy = boxH / 2 - diameter * 0.5
        if (p.x < -hx) {
          p.x = -hx
          p.vx = Math.abs(p.vx)
        } else if (p.x > hx) {
          p.x = hx
          p.vx = -Math.abs(p.vx)
        }
        if (p.y < -hy) {
          p.y = -hy
          p.vy = Math.abs(p.vy)
        } else if (p.y > hy) {
          p.y = hy
          p.vy = -Math.abs(p.vy)
        }
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          collidePair(particles[i]!, particles[j]!)
        }
      }
      hitFlash = Math.max(0, hitFlash - h * 2.5)
    }
  }

  return {
    init(params: ParamValues) {
      N = Math.min(MAX_N, Math.max(6, Math.round(Number(params.N ?? 24))))
      T = Number(params.T ?? 1.2)
      diameter = Number(params.diameter ?? 0.22)
      boxW = Number(params.boxW ?? 7)
      boxH = Number(params.boxH ?? 5)
      t = 0
      seed()
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
      integrate(dt)
    },
    seek(time: number) {
      const target = Math.min(period, Math.max(0, time))
      if (target < t - 1e-6) {
        t = 0
        seed()
      }
      const dt = target - t
      if (dt > 1e-9) {
        integrate(dt)
        t = target
      }
    },
    observe(): ObserveSnapshot {
      const n = areaDensity()
      const lambdaTh = mfpTheory2d(n, diameter)
      const lambdaMeas = pathCount > 0 ? pathSum / pathCount : lambdaTh
      const xs = new Float32Array(N)
      const ys = new Float32Array(N)
      const trailFlat: number[] = []
      const trailLens: number[] = []
      for (let i = 0; i < N; i++) {
        const p = particles[i]!
        xs[i] = p.x
        ys[i] = p.y
        trailLens.push(p.trail.length / 2)
        for (let k = 0; k < p.trail.length; k++) trailFlat.push(p.trail[k]!)
      }
      return {
        time: t,
        values: {
          N,
          T,
          diameter,
          boxW,
          boxH,
          n,
          lambdaTh,
          lambdaMeas,
          collisions,
          pathCount,
          xs,
          ys,
          trailFlat: new Float32Array(trailFlat),
          trailLens: new Float32Array(trailLens),
          lastHitX,
          lastHitY,
          hitFlash,
          period,
          tMax: period,
          world: Math.max(boxW, boxH) * 0.65 + 1,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
      seed()
    },
    setParams(params) {
      let reseeds = false
      if (params.N !== undefined) {
        N = Math.min(MAX_N, Math.max(6, Math.round(Number(params.N))))
        reseeds = true
      }
      if (params.T !== undefined) {
        T = Number(params.T)
        reseeds = true
      }
      if (params.diameter !== undefined) {
        diameter = Number(params.diameter)
        reseeds = true
      }
      if (params.boxW !== undefined) {
        boxW = Number(params.boxW)
        reseeds = true
      }
      if (params.boxH !== undefined) {
        boxH = Number(params.boxH)
        reseeds = true
      }
      if (reseeds) seed()
    },
  }
}

export const mfpMeta: DemoMeta = {
  id: 'thermo-mfp',
  subject: '热学',
  category: '分子动理论',
  tags: ['自由程', '碰撞', '输运'],
  model: 'mfp',
  adapter: 'mfp',
  time: { maxKey: 'tMax' },
  features: { compare: false, scrub: true, charts: true },
  params: [
    {
      key: 'N',
      label: '粒子数 N',
      kind: 'number',
      default: 24,
      min: 8,
      max: MAX_N,
      step: 2,
      unit: '',
    },
    {
      key: 'T',
      label: '温度 T',
      kind: 'number',
      default: 1.2,
      min: 0.4,
      max: 2.5,
      step: 0.1,
      unit: '',
    },
    {
      key: 'diameter',
      label: '直径 d',
      kind: 'number',
      default: 0.22,
      min: 0.12,
      max: 0.4,
      step: 0.02,
      unit: '',
    },
    {
      key: 'boxW',
      label: '盒宽',
      kind: 'number',
      default: 7,
      min: 5,
      max: 10,
      step: 0.5,
      unit: '',
    },
    {
      key: 'boxH',
      label: '盒高',
      kind: 'number',
      default: 5,
      min: 4,
      max: 8,
      step: 0.5,
      unit: '',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '碰撞' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: 'λ',
      chartKey: 'lambdaMeas',
      charts: [
        {
          id: 'lambda',
          title: '自由程',
          xLabel: 't (s)',
          leftLabel: 'λ',
          series: [
            { key: 'lambdaTh', label: 'λ理论', color: '#fbbf24', unit: '' },
            { key: 'lambdaMeas', label: 'λ统计', color: '#38bdf8', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'n', label: 'n', unit: '', tone: 'slate' },
    { key: 'lambdaTh', label: 'λ理', unit: '', tone: 'amber' },
    { key: 'lambdaMeas', label: 'λ测', unit: '', tone: 'blue' },
    { key: 'collisions', label: '碰撞', unit: '', tone: 'purple' },
    { key: 'N', label: 'N', unit: '', tone: 'green' },
  ],
  docs: {
    title: '平均自由程 / 扩散示意',
    summary:
      '二维硬圆气体：轨迹在碰撞处截断。理论 λ∝1/(n d)；增大密度或直径使自由程变短。',
    concept: [
      '平均自由程是连续两次碰撞间路程的平均值',
      '面密度或分子直径增大 → 碰撞更频繁 → λ 下降',
      '温度主要改变速率，对硬球 λ 的影响较弱（本模型）',
    ],
    objectives: [
      '观察轨迹长度随 n、d 的变化',
      '对照 λ_th = 1/(2√2 n d)',
      '理解输运过程与自由程的联系',
    ],
    formulas: [
      '\\lambda=\\frac{1}{2\\sqrt{2}\\, n\\, d}',
      'n=N/A',
      '\\nu\\sim \\bar v/\\lambda',
    ],
    insight: '二维教学公式；N≤48 性能护栏。金虚线圆半径≈λ_th；粉闪光为最近碰撞。',
    legend: [
      { color: '#fbbf24', label: '粒子 / 轨迹' },
      { color: '#38bdf8', label: 'λ 理论圆' },
      { color: '#f472b6', label: '碰撞点' },
    ],
    steps: [
      {
        id: 'theory',
        title: '理论自由程',
        body: 'λ 只依赖面密度与直径。',
        formulas: ['\\lambda=1/(2\\sqrt{2} n d)'],
        bindings: [
          { labelTex: 'n', valueKey: 'n', unit: '' },
          { labelTex: 'd', valueKey: 'diameter', unit: '' },
          { labelTex: '\\lambda', valueKey: 'lambdaTh', unit: '' },
        ],
      },
      {
        id: 'measure',
        title: '统计对照',
        body: '播放累积碰撞段长；λ测逐渐靠近 λ理。',
        formulas: ['\\langle \\ell \\rangle'],
        bindings: [
          { labelTex: '\\lambda_{\\mathrm{th}}', valueKey: 'lambdaTh', unit: '' },
          { labelTex: '\\lambda_{\\mathrm{meas}}', valueKey: 'lambdaMeas', unit: '' },
          { labelTex: 'N_{\\mathrm{coll}}', valueKey: 'collisions', unit: '' },
        ],
        highlightOn: 'scrub',
      },
    ],
    challenges: [
      {
        id: 'denser',
        prompt: '把 N 调到 40，使 λ理明显小于 N=16 时。',
        hint: 'n 越大 λ 越小。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'N', target: 40, tol: 4 },
            { kind: 'valueNear', key: 'lambdaTh', target: mfpTheory2d(40 / (7 * 5), 0.22), tol: 0.35 },
          ],
        },
      },
    ],
  },
}

export function registerMfpDemo(): void {
  registerDemoBundle({
    meta: mfpMeta,
    model: createMfpModel,
    adapter: createMfpAdapter,
  })
}
