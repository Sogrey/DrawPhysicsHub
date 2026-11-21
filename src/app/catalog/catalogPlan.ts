/**
 * 目录规划清单：已实现的由 registry 覆盖；此处列出待做条目与学科顺序。
 * status: soon → 卡片展示「敬请期待」，不可进入。
 */
export interface PlannedEntry {
  id: string
  subject: string
  category: string
  title: string
  tags?: string[]
}

/** 学科展示顺序 */
export const SUBJECT_ORDER = [
  '力学',
  '电磁学',
  '光学',
  '热学',
  '量子力学',
  '理论力学',
] as const

/**
 * 各学科内分类顺序（教材章节序）；未列出的分类按中文排序附后。
 * 见 docs/电磁内容规范.md、docs/光学内容规范.md、docs/力学内容规范.md。
 */
export const CATEGORY_ORDER: Record<string, readonly string[]> = {
  力学: [
    '质点运动学',
    '牛顿定律',
    '动量',
    '动量和角动量',
    '动能和势能',
    '刚体力学',
    '振动',
    '波动',
  ],
  电磁学: ['静电场', '电流磁场', '洛伦兹力', '电磁感应'],
  光学: ['几何光学', '干涉', '衍射', '偏振'],
  热学: ['分子动理论', '热力学循环'],
  量子力学: ['束缚态'],
  理论力学: ['转动参考系'],
}

/** 无真实截图时的通用占位封面（public 路径） */
export const PLACEHOLDER_COVER = '/covers/placeholder.svg'

/** 一期/近期规划中尚未落地的演示（目录先露出） */
export const PLANNED_SOON: PlannedEntry[] = [
  // —— 热学已起步；量子 / 理论力学代表预告 ——
  {
    id: 'qm-well',
    subject: '量子力学',
    category: '束缚态',
    title: '一维无限深势阱',
    tags: ['波函数', '能级'],
  },
  {
    id: 'theo-coriolis',
    subject: '理论力学',
    category: '转动参考系',
    title: '科里奥利力示意',
    tags: ['非惯性系'],
  },
]

/**
 * 已实现演示封面（真实截图）。
 * 可用 `scripts/capture-covers.mjs` 生成 / 更新 png。
 */
export const LIVE_COVERS: Record<string, string> = {
  'mech-projectile': '/covers/mech-projectile.png',
  'mech-collision-1d': '/covers/mech-collision-1d.png',
  'mech-harmonic': '/covers/mech-harmonic.png',
  'mech-damped': '/covers/mech-damped.png',
  'mech-forced': '/covers/mech-forced.png',
  'mech-pendulum': '/covers/mech-pendulum.png',
  'mech-circular': '/covers/mech-circular.png',
  'mech-natural-frame': '/covers/mech-natural-frame.png',
  'mech-incline': '/covers/mech-incline.png',
  'mech-rolling': '/covers/mech-rolling.png',
  'mech-rotation-axis': '/covers/mech-rotation-axis.png',
  'mech-wave-transverse': '/covers/mech-wave-transverse.png',
  'mech-standing-wave': '/covers/mech-standing-wave.png',
  'mech-energy-curve': '/covers/mech-energy-curve.png',
  'mech-angular-momentum': '/covers/mech-angular-momentum.png',
  'em-point-charge': '/covers/em-point-charge.png',
  'em-potential': '/covers/em-potential.png',
  'em-dipole': '/covers/em-dipole.png',
  'em-wire-b': '/covers/em-wire-b.png',
  'em-loop-b': '/covers/em-loop-b.png',
  'em-cyclotron': '/covers/em-cyclotron.png',
  'em-ampere': '/covers/em-ampere.png',
  'em-lenz': '/covers/em-lenz.png',
  'em-motional-emf': '/covers/em-motional-emf.png',
  'thermo-gas': '/covers/thermo-gas.png',
  'thermo-carnot': '/covers/thermo-carnot.png',
  'opt-double-slit': '/covers/opt-double-slit.png',
  'opt-diffraction': '/covers/opt-diffraction.png',
  'opt-malus': '/covers/opt-malus.png',
  'opt-waveplate': '/covers/opt-waveplate.png',
  'opt-refraction': '/covers/opt-refraction.png',
  'opt-lens': '/covers/opt-lens.png',
  'opt-thin-film': '/covers/opt-thin-film.png',
  'opt-grating': '/covers/opt-grating.png',
  'opt-birefringence': '/covers/opt-birefringence.png',
}
