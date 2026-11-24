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
  '数理方法',
  '近代物理',
] as const

/**
 * 各学科内分类顺序（教材章节序）；未列出的分类按中文排序附后。
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
    '流体与连续介质',
  ],
  电磁学: ['静电场', '电流磁场', '洛伦兹力', '电磁感应', '交流电路', '电磁波'],
  光学: ['几何光学', '干涉', '衍射', '偏振', '应用光学'],
  热学: ['分子动理论', '理想气体定律', '热力学过程', '热力学循环', '输运现象', '熵与不可逆', '相变'],
  量子力学: ['束缚态', '散射与隧道', '近代实验', '自旋与原子', '多体与近似'],
  理论力学: ['转动参考系', '分析力学', '刚体动力学', '有心力', '哈密顿力学'],
  数理方法: ['傅里叶分析', '复变可视化', '特殊函数', 'PDE 模态', '晶格振动', '格林函数'],
  近代物理: ['狭义相对论', '原子光谱', '核与粒子'],
}

/** 无真实截图时的通用占位封面（public 路径） */
export const PLACEHOLDER_COVER = '/covers/placeholder.svg'

/**
 * 新近落地演示（目录卡片「NEW」角标，便于专项抽检）。
 * 落地时：从 PLANNED_SOON 删除 → 加入本表；抽检稳定后可再从此表移除。
 */
export const NEW_DEMO_IDS: readonly string[] = [
  // M8-A 理论力学
  'theo-double-pendulum',
  'theo-precession',
  'theo-centrifugal',
  'theo-foucault',
  'theo-central-force',
  'theo-lagrange-bead',
  // M8-B 电动力学 / 光学进阶
  'em-emwave',
  'em-reflection',
  'em-dipole-radiation',
  'em-displacement',
  'opt-birefringence-snell',
  'opt-brewster',
  // M8-C 数理方法 / 晶格
  'math-fourier',
  'math-complex-surf',
  'math-spherical-harmonics',
  'math-wave-modes',
  'lattice-mono',
  'lattice-di',
  'lattice-graphene',
  // M8-D 既有科目补洞
  'mech-collision-inelastic',
  'mech-coupled-osc',
  'mech-beats',
  'mech-doppler',
  'mech-physical-pendulum',
  'em-rc-transient',
  'em-rlc',
  'em-mutual',
  'em-gauss',
  'opt-michelson',
  'opt-airy',
  'opt-fabry-perot',
  'thermo-conduction',
  'thermo-heat-engine',
  'thermo-phase',
  'qm-finite-well',
  'qm-wavepacket',
  'qm-stern-gerlach',
  'qm-hydrogen',
  // M8-Rel 近代物理入门
  'rel-minkowski',
  'rel-time-dilation',
  'atom-bohr',
  // M8-F 力学
  'mech-atwood',
  'mech-variable-mass',
  'mech-collision-2d',
  'mech-phase-portrait',
  'mech-bernoulli',
  // M8-F 电磁
  'em-hall',
  'em-lc',
  'em-poynting',
  'em-faraday-disk',
  // M8-F 光学 / 热学 / 量子
  'opt-fresnel-zone',
  'opt-fiber',
  'opt-abbe',
  'thermo-vanderwaals',
  'thermo-otto',
  'thermo-equipartition',
  'qm-rabi',
  'qm-tunnel-diode',
  'qm-variational',
  // M8-F 理论 / 数理 / 近代续扩
  'theo-euler-angles',
  'theo-tennis-racket',
  'theo-hamilton-phase',
  'math-bessel',
  'math-legendre',
  'math-green',
  'rel-velocity-add',
  'atom-fine-structure',
  'nuclear-decay',
]

/**
 * 后续扩包预告（目录「敬请期待」）。
 * 实现时：registerDemoBundle + LIVE_COVERS + cover-demos；落地后删对应行并写入 NEW_DEMO_IDS。
 * 批次与约定：docs/开发记录与路线图.md §4.2
 */
export const PLANNED_SOON: PlannedEntry[] = [
  // ========== M8-A 理论力学 ========== ✅ → NEW_DEMO_IDS

  // ========== M8-B 电动力学 / 光学进阶 ========== ✅ → NEW_DEMO_IDS

  // ========== M8-C 数理方法 / 晶格 ========== ✅ → NEW_DEMO_IDS

  // ========== M8-D 既有科目补洞 ========== ✅ → NEW_DEMO_IDS

  // ========== 近代物理 / 相对论入门 ========== ✅ → NEW_DEMO_IDS

  // ========== 批次 F：教材高频补课 ========== ✅ → NEW_DEMO_IDS
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
  'em-emwave': '/covers/em-emwave.png',
  'em-reflection': '/covers/em-reflection.png',
  'em-dipole-radiation': '/covers/em-dipole-radiation.png',
  'em-displacement': '/covers/em-displacement.png',
  'thermo-gas': '/covers/thermo-gas.png',
  'thermo-carnot': '/covers/thermo-carnot.png',
  'thermo-maxwell': '/covers/thermo-maxwell.png',
  'thermo-pv-process': '/covers/thermo-pv-process.png',
  'thermo-mfp': '/covers/thermo-mfp.png',
  'thermo-ideal-gas': '/covers/thermo-ideal-gas.png',
  'thermo-diffusion': '/covers/thermo-diffusion.png',
  'thermo-entropy': '/covers/thermo-entropy.png',
  'qm-well': '/covers/qm-well.png',
  'qm-barrier': '/covers/qm-barrier.png',
  'qm-oscillator': '/covers/qm-oscillator.png',
  'qm-photoelectric': '/covers/qm-photoelectric.png',
  'qm-compton': '/covers/qm-compton.png',
  'qm-blackbody': '/covers/qm-blackbody.png',
  'qm-double-slit': '/covers/qm-double-slit.png',
  'qm-alpha': '/covers/qm-alpha.png',
  'theo-coriolis': '/covers/theo-coriolis.png',
  'theo-double-pendulum': '/covers/theo-double-pendulum.png',
  'theo-precession': '/covers/theo-precession.png',
  'theo-centrifugal': '/covers/theo-centrifugal.png',
  'theo-foucault': '/covers/theo-foucault.png',
  'theo-central-force': '/covers/theo-central-force.png',
  'theo-lagrange-bead': '/covers/theo-lagrange-bead.png',
  'opt-double-slit': '/covers/opt-double-slit.png',
  'opt-diffraction': '/covers/opt-diffraction.png',
  'opt-malus': '/covers/opt-malus.png',
  'opt-waveplate': '/covers/opt-waveplate.png',
  'opt-refraction': '/covers/opt-refraction.png',
  'opt-lens': '/covers/opt-lens.png',
  'opt-thin-film': '/covers/opt-thin-film.png',
  'opt-grating': '/covers/opt-grating.png',
  'opt-birefringence': '/covers/opt-birefringence.png',
  'opt-birefringence-snell': '/covers/opt-birefringence-snell.png',
  'opt-brewster': '/covers/opt-brewster.png',
  'math-fourier': '/covers/math-fourier.png',
  'math-complex-surf': '/covers/math-complex-surf.png',
  'math-spherical-harmonics': '/covers/math-spherical-harmonics.png',
  'math-wave-modes': '/covers/math-wave-modes.png',
  'lattice-mono': '/covers/lattice-mono.png',
  'lattice-di': '/covers/lattice-di.png',
  'lattice-graphene': '/covers/lattice-graphene.png',
  'mech-collision-inelastic': '/covers/mech-collision-inelastic.png',
  'mech-coupled-osc': '/covers/mech-coupled-osc.png',
  'mech-beats': '/covers/mech-beats.png',
  'mech-doppler': '/covers/mech-doppler.png',
  'mech-physical-pendulum': '/covers/mech-physical-pendulum.png',
  'em-rc-transient': '/covers/em-rc-transient.png',
  'em-rlc': '/covers/em-rlc.png',
  'em-mutual': '/covers/em-mutual.png',
  'em-gauss': '/covers/em-gauss.png',
  'opt-michelson': '/covers/opt-michelson.png',
  'opt-airy': '/covers/opt-airy.png',
  'opt-fabry-perot': '/covers/opt-fabry-perot.png',
  'thermo-conduction': '/covers/thermo-conduction.png',
  'thermo-heat-engine': '/covers/thermo-heat-engine.png',
  'thermo-phase': '/covers/thermo-phase.png',
  'qm-finite-well': '/covers/qm-finite-well.png',
  'qm-wavepacket': '/covers/qm-wavepacket.png',
  'qm-stern-gerlach': '/covers/qm-stern-gerlach.png',
  'qm-hydrogen': '/covers/qm-hydrogen.png',
  'rel-minkowski': '/covers/rel-minkowski.png',
  'rel-time-dilation': '/covers/rel-time-dilation.png',
  'atom-bohr': '/covers/atom-bohr.png',
  'mech-atwood': '/covers/mech-atwood.png',
  'mech-variable-mass': '/covers/mech-variable-mass.png',
  'mech-collision-2d': '/covers/mech-collision-2d.png',
  'mech-phase-portrait': '/covers/mech-phase-portrait.png',
  'mech-bernoulli': '/covers/mech-bernoulli.png',
  'em-hall': '/covers/em-hall.png',
  'em-lc': '/covers/em-lc.png',
  'em-poynting': '/covers/em-poynting.png',
  'em-faraday-disk': '/covers/em-faraday-disk.png',
  'opt-fresnel-zone': '/covers/opt-fresnel-zone.png',
  'opt-fiber': '/covers/opt-fiber.png',
  'opt-abbe': '/covers/opt-abbe.png',
  'thermo-vanderwaals': '/covers/thermo-vanderwaals.png',
  'thermo-otto': '/covers/thermo-otto.png',
  'thermo-equipartition': '/covers/thermo-equipartition.png',
  'qm-rabi': '/covers/qm-rabi.png',
  'qm-tunnel-diode': '/covers/qm-tunnel-diode.png',
  'qm-variational': '/covers/qm-variational.png',
  'theo-euler-angles': '/covers/theo-euler-angles.png',
  'theo-tennis-racket': '/covers/theo-tennis-racket.png',
  'theo-hamilton-phase': '/covers/theo-hamilton-phase.png',
  'math-bessel': '/covers/math-bessel.png',
  'math-legendre': '/covers/math-legendre.png',
  'math-green': '/covers/math-green.png',
  'rel-velocity-add': '/covers/rel-velocity-add.png',
  'atom-fine-structure': '/covers/atom-fine-structure.png',
  'nuclear-decay': '/covers/nuclear-decay.png',
}
