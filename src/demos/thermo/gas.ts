import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createGasAdapter } from './gasAdapter'

const MAX_N = 80

type Particle = { x: number; y: number; vx: number; vy: number }

/**
 * 分子碰撞与压强示意（2D 硬球盒子）：
 *   粒子与器壁弹性碰撞；记录右壁冲量 → 压强示意
 *   教学：P ∝ n ⟨v²⟩（二维动能相关；与三维 1/3 因子对照说明）
 * 播放：演化一段时间，观察碰撞闪光与压强读数稳定。
 */
export function createGasModel(): PhysicsModel {
  let N = 40
  let T = 1.2 // 温度参数 → 速度尺度
  let boxW = 6
  let boxH = 4
  let t = 0
  const period = 10
  let particles: Particle[] = []
  let impulseRight = 0
  let impulseWindow = 0
  let collisions = 0
  let lastHitX = 0
  let lastHitY = 0
  let hitFlash = 0

  function speedScale() {
    return Math.sqrt(Math.max(0.2, T)) * 2.2
  }

  function seed() {
    particles = []
    const sp = speedScale()
    const margin = 0.25
    for (let i = 0; i < N; i++) {
      const ang = Math.random() * Math.PI * 2
      const speed = sp * (0.55 + Math.random() * 0.9)
      particles.push({
        x: (-boxW / 2 + margin) + Math.random() * (boxW - 2 * margin),
        y: (-boxH / 2 + margin) + Math.random() * (boxH - 2 * margin),
        vx: speed * Math.cos(ang),
        vy: speed * Math.sin(ang),
      })
    }
    impulseRight = 0
    impulseWindow = 0
    collisions = 0
    hitFlash = 0
  }

  function meanV2() {
    if (particles.length === 0) return 0
    let s = 0
    for (const p of particles) s += p.vx * p.vx + p.vy * p.vy
    return s / particles.length
  }

  function stepPhysics(dt: number) {
    const hw = boxW / 2
    const hh = boxH / 2
    const r = 0.12
    hitFlash = Math.max(0, hitFlash - dt * 3)
    for (const p of particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      // walls
      if (p.x > hw - r) {
        const dv = Math.abs(p.vx)
        impulseRight += 2 * dv // m=1
        impulseWindow += 2 * dv
        collisions++
        lastHitX = hw
        lastHitY = p.y
        hitFlash = 1
        p.x = hw - r
        p.vx = -Math.abs(p.vx)
      } else if (p.x < -hw + r) {
        p.x = -hw + r
        p.vx = Math.abs(p.vx)
      }
      if (p.y > hh - r) {
        p.y = hh - r
        p.vy = -Math.abs(p.vy)
      } else if (p.y < -hh + r) {
        p.y = -hh + r
        p.vy = Math.abs(p.vy)
      }
    }
  }

  return {
    init(params: ParamValues) {
      N = Math.min(MAX_N, Math.max(8, Math.round(Number(params.N ?? 40))))
      T = Number(params.T ?? 1.2)
      boxW = Number(params.boxW ?? 6)
      boxH = Number(params.boxH ?? 4)
      t = 0
      seed()
    },
    step(dt: number) {
      const Tmax = period
      const h = Math.min(dt, 1 / 60)
      let left = Math.min(Tmax - t, dt)
      while (left > 1e-9) {
        const step = Math.min(h, left)
        stepPhysics(step)
        left -= step
        t += step
      }
      t = Math.min(Tmax, t)
    },
    seek(time: number) {
      // 粒子混沌：seek 重种子并快进
      const target = Math.min(period, Math.max(0, time))
      seed()
      t = 0
      const dt = 1 / 60
      while (t < target - 1e-9) {
        const step = Math.min(dt, target - t)
        stepPhysics(step)
        t += step
      }
    },
    observe(): ObserveSnapshot {
      const v2 = meanV2()
      const area = boxW * boxH
      const n = N / Math.max(area, 1e-6)
      // 二维示意：P ~ (1/2) n m ⟨v²⟩ ；右壁冲量率 ≈ P * H
      const Ptheory = 0.5 * n * v2
      const elapsed = Math.max(t, 0.35)
      const Pmeasure = impulseRight / (elapsed * boxH)
      const xs = new Float32Array(N)
      const ys = new Float32Array(N)
      const vxs = new Float32Array(N)
      const vys = new Float32Array(N)
      for (let i = 0; i < N; i++) {
        const p = particles[i]!
        xs[i] = p.x
        ys[i] = p.y
        vxs[i] = p.vx
        vys[i] = p.vy
      }
      return {
        time: t,
        values: {
          N,
          T,
          boxW,
          boxH,
          n,
          v2,
          vrms: Math.sqrt(v2),
          Ptheory,
          Pmeasure,
          collisions,
          hitFlash,
          lastHitX,
          lastHitY,
          impulseRight,
          xs,
          ys,
          vxs,
          vys,
          period,
          tMax: period,
          world: Math.max(boxW, boxH) * 0.75 + 1.2,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
      seed()
    },
    setParams(params) {
      let reseed = false
      if (params.N !== undefined) {
        N = Math.min(MAX_N, Math.max(8, Math.round(Number(params.N))))
        reseed = true
      }
      if (params.T !== undefined) {
        T = Number(params.T)
        reseed = true
      }
      if (params.boxW !== undefined) {
        boxW = Number(params.boxW)
        reseed = true
      }
      if (params.boxH !== undefined) {
        boxH = Number(params.boxH)
        reseed = true
      }
      if (reseed) {
        const keepT = t
        seed()
        // 保持时间轴位置但重模拟
        t = 0
        const dt = 1 / 60
        while (t < keepT - 1e-9) {
          const step = Math.min(dt, keepT - t)
          stepPhysics(step)
          t += step
        }
      }
    },
  }
}

export const gasMeta: DemoMeta = {
  id: 'thermo-gas',
  subject: '热学',
  category: '分子动理论',
  tags: ['气体', '压强', '分子碰撞'],
  model: 'gas',
  adapter: 'gas',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'N',
      label: '粒子数 N',
      kind: 'number',
      default: 40,
      min: 12,
      max: 80,
      step: 4,
      unit: '',
    },
    {
      key: 'T',
      label: '温度参数 T',
      kind: 'number',
      default: 1.2,
      min: 0.4,
      max: 2.5,
      step: 0.1,
      unit: '',
    },
    {
      key: 'boxW',
      label: '盒宽',
      kind: 'number',
      default: 6,
      min: 4,
      max: 8,
      step: 0.5,
      unit: 'u',
    },
    {
      key: 'boxH',
      label: '盒高',
      kind: 'number',
      default: 4,
      min: 3,
      max: 6,
      step: 0.5,
      unit: 'u',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '分子' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'Pmeasure',
      charts: [
        {
          id: 'pressure',
          title: '压强示意',
          xLabel: 't (s)',
          leftLabel: 'P',
          series: [
            { key: 'Pmeasure', label: 'P(测)', color: '#f472b6', unit: '' },
            { key: 'Ptheory', label: 'P∝n⟨v²⟩', color: '#38bdf8', unit: '' },
            { key: 'vrms', label: 'v_rms', color: '#fbbf24', unit: '' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'Pmeasure', label: 'P测', unit: '', tone: 'purple' },
    { key: 'Ptheory', label: 'P论', unit: '', tone: 'blue' },
    { key: 'vrms', label: 'vᵣₘₛ', unit: '', tone: 'amber' },
    { key: 'N', label: 'N', unit: '', tone: 'green' },
    { key: 'collisions', label: '撞壁', unit: '', tone: 'slate' },
  ],
  docs: {
    title: '分子碰撞与压强示意',
    summary:
      '盒子中大量分子与器壁弹性碰撞。右壁冲量率给出压强示意；对照二维关系 P∝n⟨v²⟩。提高 T 或 N，压强上升。',
    concept: [
      '压强来自分子对器壁的动量传递（冲量/时间/面积）。',
      '温度越高，分子越快，⟨v²⟩ 越大，压强越大。',
      '本演示为二维示意；三维教材常写 P=(1/3)ρ⟨v²⟩。',
    ],
    objectives: [
      '观察右壁碰撞闪光与冲量累积',
      '对照 P测 与 P∝n⟨v²⟩',
      '改变 T、N 看压强变化趋势',
    ],
    formulas: [
      'P\\sim \\tfrac12 n\\langle v^2\\rangle\\quad(2D\\text{示意})',
      'v_{\\mathrm{rms}}=\\sqrt{\\langle v^2\\rangle}',
      'n=N/A',
    ],
    insight:
      '青框为容器；黄点为分子；右侧粉边为测压壁。顶栏对照理论与冲量测得压强。',
    legend: [
      { color: '#38bdf8', label: '容器' },
      { color: '#fbbf24', label: '分子' },
      { color: '#f472b6', label: '测压壁 / 碰撞' },
      { color: '#94a3b8', label: '速度示意' },
    ],
    steps: [
      {
        id: 'collide',
        title: '撞壁冲量',
        body: '弹性撞壁速度法向反向，传递动量 2m|vₙ|。',
        formulas: ['\\Delta p=2m|v_n|'],
        bindings: [{ labelTex: '撞壁次数', valueKey: 'collisions', unit: '' }],
        highlightOn: 'scrub',
      },
      {
        id: 'pressure',
        title: '压强',
        body: '压强≈冲量/(时间×壁长)。',
        formulas: ['P\\sim \\tfrac12 n\\langle v^2\\rangle'],
        bindings: [
          { labelTex: 'P_{\\mathrm{测}}', valueKey: 'Pmeasure', unit: '' },
          { labelTex: 'P_{\\mathrm{论}}', valueKey: 'Ptheory', unit: '' },
        ],
      },
      {
        id: 'temp',
        title: '温度',
        body: 'T 提高 → v_rms 提高 → P 提高。',
        formulas: ['v_{\\mathrm{rms}}=\\sqrt{\\langle v^2\\rangle}'],
        bindings: [
          { labelTex: 'T', valueKey: 'T', unit: '' },
          { labelTex: 'v_{\\mathrm{rms}}', valueKey: 'vrms', unit: '' },
        ],
      },
    ],
    challenges: [
      {
        id: 'hotter',
        prompt: '把 T 调到约 2.0，使 v_rms 明显高于默认。',
        hint: '温度参数越大，分子越快。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'T', target: 2, tol: 0.35 },
            { kind: 'valueNear', key: 'vrms', target: 3.2, tol: 1.5 },
          ],
        },
      },
      {
        id: 'more-N',
        prompt: '取 N≈60，观察 P论 随数密度上升。',
        hint: 'n=N/A，N 越大 n 越大。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'N', target: 60, tol: 12 },
            { kind: 'valueNear', key: 'n', target: 2.5, tol: 1.5 },
          ],
        },
      },
    ],
  },
}

export function registerGasDemo(): void {
  registerDemoBundle({
    meta: gasMeta,
    model: createGasModel,
    adapter: createGasAdapter,
  })
}
