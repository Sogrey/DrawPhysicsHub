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

/** 无真实截图时的通用占位封面（public 路径） */
export const PLACEHOLDER_COVER = '/covers/placeholder.svg'

/** 一期/近期规划中尚未落地的演示（目录先露出） */
export const PLANNED_SOON: PlannedEntry[] = [
  // 力学补齐
  {
    id: 'mech-natural-frame',
    subject: '力学',
    category: '质点运动学',
    title: '自然坐标系速度/加速度',
    tags: ['切向', '法向', '曲率'],
  },
  {
    id: 'mech-wave-transverse',
    subject: '力学',
    category: '波动',
    title: '横波形成与传播',
    tags: ['波动', '传播'],
  },
  {
    id: 'mech-standing-wave',
    subject: '力学',
    category: '波动',
    title: '驻波',
    tags: ['驻波', '叠加'],
  },
  {
    id: 'mech-rotation-axis',
    subject: '力学',
    category: '刚体力学',
    title: '定轴转动',
    tags: ['角速度', '刚体'],
  },
  {
    id: 'mech-energy-curve',
    subject: '力学',
    category: '动能和势能',
    title: '机械能 / 势能曲线',
    tags: ['势能', '守恒'],
  },
  // 电磁学
  {
    id: 'em-point-charge',
    subject: '电磁学',
    category: '静电场',
    title: '点电荷电场叠加',
    tags: ['电场', '库仑'],
  },
  {
    id: 'em-dipole',
    subject: '电磁学',
    category: '静电场',
    title: '电偶极子场',
    tags: ['偶极', '电场'],
  },
  {
    id: 'em-wire-b',
    subject: '电磁学',
    category: '电流磁场',
    title: '无限长直导线磁场',
    tags: ['磁场', '毕奥-萨伐尔'],
  },
  {
    id: 'em-cyclotron',
    subject: '电磁学',
    category: '洛伦兹力',
    title: '洛伦兹力回旋',
    tags: ['洛伦兹力', '回旋'],
  },
  {
    id: 'em-lenz',
    subject: '电磁学',
    category: '电磁感应',
    title: '磁通量 / 楞次定律',
    tags: ['感应', '楞次'],
  },
  // 光学
  {
    id: 'opt-double-slit',
    subject: '光学',
    category: '干涉',
    title: '双缝干涉条纹',
    tags: ['干涉', '杨氏'],
  },
  {
    id: 'opt-diffraction',
    subject: '光学',
    category: '衍射',
    title: '单缝衍射',
    tags: ['衍射'],
  },
  {
    id: 'opt-malus',
    subject: '光学',
    category: '偏振',
    title: '偏振片起偏检偏（马吕斯）',
    tags: ['偏振', '马吕斯'],
  },
  {
    id: 'opt-refraction',
    subject: '光学',
    category: '几何光学',
    title: '反射折射光路',
    tags: ['折射', '斯涅尔'],
  },
  // 热学 / 量子（代表条）
  {
    id: 'thermo-gas',
    subject: '热学',
    category: '分子动理论',
    title: '分子碰撞与压强示意',
    tags: ['气体', '压强'],
  },
  {
    id: 'thermo-carnot',
    subject: '热学',
    category: '热力学循环',
    title: '卡诺循环 P–V 图',
    tags: ['卡诺', '效率'],
  },
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
  'mech-incline': '/covers/mech-incline.png',
  'mech-rolling': '/covers/mech-rolling.png',
}
