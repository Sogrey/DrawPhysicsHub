import type { DemoMeta, ObserveSnapshot, ParamValues, PhysicsModel } from '@/core/physics/types'
import { registerDemoBundle } from '@/core/physics/registry'
import { createAmpereAdapter } from './ampereAdapter'

/**
 * 安培力（匀强 B 中直导线）：
 *   F⃗ = I L⃗ × B⃗
 * 本演示：B 沿 +z（出纸面 ·；B<0 则入纸面 ×），导线在 xy 面内与 x 轴夹角 α，
 *   |F| = |I| L |B|（I 与 B 始终垂直），方向由右手定则。
 *
 * 教学单位直接算 F = I L B 的分量：
 *   L⃗ = L (cosα, sinα, 0)，B⃗ = (0,0,B)
 *   F⃗ = I L B (sinα, −cosα, 0)
 *
 * 播放：电流 I 从 −Imax 扫到 +Imax，观察 F 反向。
 */
export function ampereForce(
  I: number,
  L: number,
  B: number,
  alphaDeg: number,
): { Fx: number; Fy: number; Fmag: number; lx: number; ly: number } {
  const a = (alphaDeg * Math.PI) / 180
  const lx = Math.cos(a)
  const ly = Math.sin(a)
  const LL = Math.max(0.2, L)
  // F = I (L × B) ，B=Bẑ → F = I L B (ly, −lx, 0) wait:
  // L × B = |i    j    k| = i (Ly Bz) - j (Lx Bz) = (L ly B, -L lx B, 0)
  //         |Lx  Ly   0|
  //         |0    0   B|
  const Fx = I * LL * B * ly
  const Fy = -I * LL * B * lx
  const Fmag = Math.hypot(Fx, Fy)
  return { Fx, Fy, Fmag, lx, ly }
}

export function createAmpereModel(): PhysicsModel {
  let L = 2.4
  let B = 1.2
  let alpha = 0
  let Imax = 2
  let t = 0
  const period = 8

  function IAt(time: number) {
    // −Imax → +Imax
    const u = Math.min(1, Math.max(0, time / period))
    return -Imax + 2 * Imax * u
  }

  return {
    init(params: ParamValues) {
      L = Number(params.L ?? 2.4)
      B = Number(params.B ?? 1.2)
      alpha = Number(params.alpha ?? 0)
      Imax = Number(params.Imax ?? 2)
      t = 0
    },
    step(dt: number) {
      t = Math.min(period, t + dt)
    },
    seek(time: number) {
      t = Math.min(period, Math.max(0, time))
    },
    observe(): ObserveSnapshot {
      const I = IAt(t)
      const f = ampereForce(I, L, B, alpha)
      // 导线中点在原点；轻微位移示意受力（教学夸张）
      const shift = 0.15 * Math.tanh(f.Fmag * 0.35)
      const ux = f.Fmag > 1e-9 ? f.Fx / f.Fmag : 0
      const uy = f.Fmag > 1e-9 ? f.Fy / f.Fmag : 0
      return {
        time: t,
        values: {
          I,
          Imax,
          L,
          B,
          alpha,
          Fx: f.Fx,
          Fy: f.Fy,
          Fmag: f.Fmag,
          lx: f.lx,
          ly: f.ly,
          cx: ux * shift,
          cy: uy * shift,
          Bout: B >= 0 ? 1 : 0,
          Ftheory: Math.abs(I) * L * Math.abs(B),
          period,
          tMax: period,
          world: 5,
          done: t >= period - 1e-9 ? 1 : 0,
        },
      }
    },
    reset() {
      t = 0
    },
    setParams(params) {
      if (params.L !== undefined) L = Number(params.L)
      if (params.B !== undefined) B = Number(params.B)
      if (params.alpha !== undefined) alpha = Number(params.alpha)
      if (params.Imax !== undefined) Imax = Number(params.Imax)
    },
  }
}

export const ampereMeta: DemoMeta = {
  id: 'em-ampere',
  subject: '电磁学',
  category: '洛伦兹力',
  tags: ['安培力', '电流', '磁场'],
  model: 'ampere',
  adapter: 'ampere',
  time: { maxKey: 'tMax' },
  features: {
    compare: false,
    scrub: true,
    charts: true,
  },
  params: [
    {
      key: 'Imax',
      label: '电流幅度',
      kind: 'number',
      default: 2,
      min: 0.5,
      max: 3,
      step: 0.1,
      unit: 'A',
    },
    {
      key: 'L',
      label: '导线长 L',
      kind: 'number',
      default: 2.4,
      min: 1,
      max: 4,
      step: 0.1,
      unit: 'm',
    },
    {
      key: 'B',
      label: '磁感应 B',
      kind: 'number',
      default: 1.2,
      min: -2.5,
      max: 2.5,
      step: 0.1,
      unit: 'T',
    },
    {
      key: 'alpha',
      label: '导线方位 α',
      kind: 'number',
      default: 0,
      min: -90,
      max: 90,
      step: 5,
      unit: '°',
    },
  ],
  views: [
    { id: 'main2d', kind: 'canvas2d', title: '安培力' },
    { id: 'scene3d', kind: 'three', title: '3D 示意' },
    {
      id: 'chart',
      kind: 'chart',
      title: '曲线',
      chartKey: 'Fmag',
      charts: [
        {
          id: 'force',
          title: '安培力',
          xLabel: 't (s)',
          leftLabel: 'F',
          series: [
            { key: 'Fmag', label: '|F|', color: '#f472b6', unit: 'u' },
            { key: 'I', label: 'I', color: '#4ade80', unit: 'A' },
            { key: 'Fy', label: 'Fᵧ', color: '#fbbf24', unit: 'u' },
          ],
        },
      ],
    },
    { id: 'docs', kind: 'docs', title: '说明' },
  ],
  readouts: [
    { key: 't', label: 't', unit: 's', tone: 'cyan' },
    { key: 'I', label: 'I', unit: 'A', tone: 'green' },
    { key: 'Fmag', label: '|F|', unit: 'u', tone: 'purple' },
    { key: 'Fx', label: 'Fₓ', unit: 'u', tone: 'blue' },
    { key: 'Fy', label: 'Fᵧ', unit: 'u', tone: 'amber' },
    { key: 'B', label: 'B', unit: 'T', tone: 'slate' },
  ],
  docs: {
    title: '安培力（导线受力）',
    summary:
      '匀强磁场中直导线：F⃗=I L⃗×B⃗。B 垂直纸面时 |F|=|I|L|B|。播放扫过电流正负，受力反向；右手定则：四指 I→弯向 B，掌心推 F。',
    concept: [
      '安培力是导线中自由电荷所受洛伦兹力的宏观表现。',
      '方向：右手定则（I、B、F 右手螺旋）。',
      '反转 I 或 B，F 反向；|F|∝|I|、L、|B|。',
    ],
    objectives: [
      '对照 |F|=|I|L|B| 与画面箭头',
      '改变 I 符号观察 F 反向',
      '改变 α 观察 F 方向跟着转',
    ],
    formulas: [
      '\\vec F=I\\,\\vec L\\times\\vec B',
      '|F|=|I|L|B|\\quad(I\\perp B)',
      '\\vec L=L(\\cos\\alpha,\\sin\\alpha)',
    ],
    insight:
      '灰点为 B（·出/×入）；绿箭头为电流；粉箭头为安培力。顶栏代入 I、L、B 核对 |F|。',
    legend: [
      { color: '#94a3b8', label: 'B 场（·/×）' },
      { color: '#4ade80', label: '电流 I / 导线' },
      { color: '#f472b6', label: '安培力 F' },
      { color: '#fbbf24', label: '导线方位' },
    ],
    steps: [
      {
        id: 'formula',
        title: '安培力公式',
        body: 'I 与 B 垂直时 |F|=|I|L|B|。',
        formulas: ['|F|=|I|L|B|'],
        bindings: [
          { labelTex: 'I', valueKey: 'I', unit: 'A' },
          { labelTex: 'L', valueKey: 'L', unit: 'm' },
          { labelTex: 'B', valueKey: 'B', unit: 'T' },
          { labelTex: '|F|', valueKey: 'Fmag', unit: 'u' },
        ],
        highlightOn: 'scrub',
      },
      {
        id: 'direction',
        title: '方向',
        body: '右手：四指 I 弯向 B，拇指（或掌心）推 F。',
        formulas: ['\\vec F=I\\vec L\\times\\vec B'],
        bindings: [
          { labelTex: 'F_x', valueKey: 'Fx', unit: 'u' },
          { labelTex: 'F_y', valueKey: 'Fy', unit: 'u' },
        ],
      },
      {
        id: 'alpha',
        title: '导线方位',
        body: '改变 α 旋转导线，F 始终 ⊥ L 且 ⊥ B。',
        formulas: ['\\alpha'],
        bindings: [{ labelTex: '\\alpha', valueKey: 'alpha', unit: '°' }],
      },
    ],
    challenges: [
      {
        id: 'magnitude',
        prompt: '取 Imax=2、L=2.4、B=1.2，扫到 I≈2 使 |F|≈5.76。',
        hint: '|F|=|I|L|B|=2×2.4×1.2=5.76。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'L', target: 2.4, tol: 0.15 },
            { kind: 'paramNear', key: 'B', target: 1.2, tol: 0.15 },
            { kind: 'valueNear', key: 'I', target: 2, tol: 0.35 },
            { kind: 'valueNear', key: 'Fmag', target: 5.76, tol: 0.9 },
          ],
        },
      },
      {
        id: 'reverse',
        prompt: '扫到 I 为负，使 Fᵧ 与 I>0 时反向（α=0 时 Fᵧ 变号）。',
        hint: '播放前半段 I<0。',
        check: {
          kind: 'all',
          checks: [
            { kind: 'paramNear', key: 'alpha', target: 0, tol: 10 },
            { kind: 'valueNear', key: 'I', target: -1.5, tol: 1.2 },
            { kind: 'valueNear', key: 'Fy', target: 4, tol: 5 },
          ],
        },
      },
    ],
  },
}

export function registerAmpereDemo(): void {
  registerDemoBundle({
    meta: ampereMeta,
    model: createAmpereModel,
    adapter: createAmpereAdapter,
  })
}
