import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createLoopBAdapter } from './loopBAdapter'

/**
 * 载流圆环磁场（圆环在 yz 平面，轴沿 x；教学取 μ₀/2 = 1）：
 *   轴上：Bₓ = I a² / (a² + x²)^{3/2} ，Bᵧ=0
 *   一般点：毕奥–萨伐尔数值积分（μ₀/(4π)=1/(2π)）
 *
 * 2D 为过轴截面：上下两点 ·/× 表示圆环截面电流。
 * 播放：探测点沿轴线从左扫到右。
 */
export const LOOP_K = 1 / (2 * Math.PI) // μ₀/(4π)，配合 μ₀=2

/** 轴上场（解析） */
export function loopBAxis(I: number, a: number, x: number): number {
  const aa = Math.max(0.15, a)
  const den = (aa * aa + x * x) ** 1.5
  return (I * aa * aa) / Math.max(den, 1e-12)
}

/** 毕奥–萨伐尔：圆环 r'=(0, a cosφ, a sinφ)，观测点 (x,y,0) */
export function loopBAt(
  I: number,
  a: number,
  x: number,
  y: number,
  nSeg = 64,
): [number, number] {
  const aa = Math.max(0.15, a)
  let Bx = 0
  let By = 0
  const dphi = (2 * Math.PI) / nSeg
  for (let i = 0; i < nSeg; i++) {
    const phi = i * dphi
    const c = Math.cos(phi)
    const s = Math.sin(phi)
    // r' = (0, a c, a s)
    // dl = a dφ (0, -s, c)
    const rx = x - 0
    const ry = y - aa * c
    const rz = 0 - aa * s
    const r2 = rx * rx + ry * ry + rz * rz
    if (r2 < 0.04 * 0.04) continue
    const r = Math.sqrt(r2)
    const r3 = r2 * r
    const dlx = 0
    const dly = -aa * s * dphi
    const dlz = aa * c * dphi
    // dl × r
    const cx = dly * rz - dlz * ry
    const cy = dlz * rx - dlx * rz
    // cz unused in xy slice
    Bx += (LOOP_K * I * cx) / r3
    By += (LOOP_K * I * cy) / r3
  }
  return [Bx, By]
}

export function createLoopBModel(): PhysicsModel {
  let I = 2
  let a = 1.4
  let zMax = 3.2
  let t = 0

  function period() {
    return 8
  }

  function probeAt(time: number) {
    // 沿轴从 -zMax 扫到 +zMax
    const u = Math.min(1, Math.max(0, time / period()))
    const x = -zMax + 2 * zMax * u
    const y = 0
    const [Bx, By] = loopBAt(I, a, x, y)
    const Baxis = loopBAxis(I, a, x)
    const Bmag = Math.hypot(Bx, By)
    return { x, y, Bx, By, Bmag, Baxis }
  }

  return {
    init(params: ParamValues) {
      I = Number(params.I ?? 2)
      a = Number(params.a ?? 1.4)
      zMax = Number(params.zMax ?? 3.2)
      t = 0
    },
    step(dt: number) {
      const T = period()
      t = Math.min(T, t + dt)
    },
    seek(time: number) {
      const T = period()
      t = Math.min(T, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const p = probeAt(t)
      const T = period()
      const B0 = loopBAxis(I, a, 0)
      return {
        time: t,
        values: {
          I,
          a,
          zMax,
          x: p.x,
          y: p.y,
          Bx: p.Bx,
          By: p.By,
          Bmag: p.Bmag,
          Baxis: p.Baxis,
          B0,
          period: T,
          tMax: T,
          world: Math.max(4.5, zMax + 1.2),
          sense: I >= 0 ? 1 : -1,
          done: t >= T - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.I !== undefined) I = Number(params.I)
      if (params.a !== undefined) a = Number(params.a)
      if (params.zMax !== undefined) zMax = Number(params.zMax)
    },
  }
}

export const loopBMeta: DemoMeta = {
  id: 'em-loop-b',
  subject: '电磁学',
  category: '电流磁场',
  tags: ['圆环', '毕奥-萨伐尔', '磁场'],
  model: 'loopB',
  adapter: 'loopB',
  time: { maxKey: 'tMax' },
  features: {
    compare: true,
    scrub: true,
    charts: true,
    compareLegendId: 'compare',
  },
  params: [
    {
      key: 'I',
      label: '电流 I',
      kind: 'number',
      default: 2,
      min: -3,
      max: 3,
      step: 0.1,
      unit: 'A',
    },
    {
      key: 'a',
      label: '半径 a',
      kind: 'number',
      default: 1.4,
      min: 0.6,
      max: 2.5,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'zMax',
      label: '轴向扫程',
      kind: 'number',
      default: 3.2,
      min: 2,
      max: 5,
      step: 0.2,
      unit: 'm',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '磁场' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'Baxis',
      charts: [
        {
          id: 'Baxis',
          title: '轴上磁场',
          xLabel: 't (s)',
          leftLabel: 'B',
          series: [
            { key: 'Baxis', label: 'B∥(轴)', color: '#34d399', unit: 'u' },
            { key: 'Bx', label: 'Bₓ', color: '#60a5fa', unit: 'u' },
            { key: 'x', label: 'x', color: '#fbbf24', unit: 'm' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'x', label: 'x', unit: 'm', tone: 'amber' },
    { key: 'Baxis', label: 'B∥', unit: 'u', tone: 'green' },
    { key: 'B0', label: 'B(0)', unit: 'u', tone: 'purple' },
    { key: 'I', label: 'I', unit: 'A', tone: 'blue' },
    { key: 'a', label: 'a', unit: 'm', tone: 'slate' },
  ],
  docs: {
    title: '载流圆环磁场',
    summary:
      '圆环轴上场 B∥=I a²/(a²+x²)^{3/2}（教学 μ₀/2=1）。侧视见上下 ·/× 截面；磁力线穿过环心。探测点沿轴扫过。',
    concept: [
      '毕奥–萨伐尔对圆环积分，轴上仅剩轴向分量。',
      '环心最强 B(0)=I/a；远处 |B|∝1/|x|³ 似磁偶极。',
      '右手定则：四指沿电流环绕，拇指为轴上场方向。',
    ],
    objectives: [
      '对照轴上公式与探测点 B∥',
      '在环心验证 B(0)=I/a',
      '反转 I 观察场方向反转',
    ],
    formulas: [
      'B_\\parallel=\\dfrac{\\mu_0}{2}\\dfrac{I a^2}{(a^2+x^2)^{3/2}}',
      '\\mu_0/2=1\\Rightarrow B_\\parallel=I a^2/(a^2+x^2)^{3/2}',
      'B(0)=I/a',
    ],
    insight:
      '顶栏把轴上公式代入当前 x；应与青绿读数一致。黄点沿轴移动，环心处 |B| 最大。',
    legend: [
      { color: '#f87171', label: '圆环截面（·/×）' },
      { color: '#34d399', label: '磁力线' },
      { color: '#60a5fa', label: '轴上场 B∥' },
      { id: 'compare', color: '#a78bfa', label: '轴线' },
      { color: '#fbbf24', label: '探测点' },
    ],
    steps: [
      {
        id: 'axis',
        title: '轴上公式',
        body: '轴上磁场仅有轴向分量，随距离衰减。',
        formulas: ['B_\\parallel=I a^2/(a^2+x^2)^{3/2}'],
        bindings: [
          { labelTex: 'I', valueKey: 'I', unit: 'A' },
          { labelTex: 'a', valueKey: 'a', unit: 'm' },
          { labelTex: 'x', valueKey: 'x', unit: 'm' },
          { labelTex: 'B_\\parallel', valueKey: 'Baxis', unit: 'u' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'center',
        title: '环心',
        body: 'x=0 时 B(0)=I/a。',
        formulas: ['B(0)=I/a'],
        bindings: [{ labelTex: 'B(0)', valueKey: 'B0', unit: 'u' }],
      },
      {
        id: 'hand',
        title: '右手定则',
        body: '四指沿电流，拇指指向轴上场（I>0 向右）。',
        formulas: ['I>0\\Rightarrow B_\\parallel>0'],
        bindings: [{ labelTex: 'I', valueKey: 'I', unit: 'A' }],
      },
    ],
    challenges: [
      {
        id: 'center-B',
        prompt: '取 I=2、a=1.4，使环心 B(0)≈1.43。',
        hint: 'B(0)=I/a=2/1.4≈1.43。拖到 x≈0 核对。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'I', target: 2, tol: 0.15 },
            { kind: 'paramNear', key: 'a', target: 1.4, tol: 0.1 },
            { kind: 'valueNear', key: 'B0', target: 1.429, tol: 0.12 },
          ],
        },
      },
      {
        id: 'far-axis',
        prompt: '把探测点扫到 |x|≈3，使 |B∥| 明显小于环心。',
        hint: '远处按 1/|x|³ 衰减。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'valueNear', key: 'x', target: 3, tol: 1.2 },
            { kind: 'valueNear', key: 'Baxis', target: 0.15, tol: 0.2 },
          ],
        },
      },
    ],
  },
}

export function registerLoopBDemo(): void {
  registerDemoBundle({
    meta: loopBMeta,
    model: createLoopBModel,
    adapter: createLoopBAdapter,
  })
}
