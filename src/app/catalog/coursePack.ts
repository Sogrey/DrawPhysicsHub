/**
 * 大学物理课次包 v1：按教材章节串现有 live 演示。
 * 仅引用已落地 id；缺省条目在解析时跳过。
 */

export interface CourseLesson {
  id: string
  title: string
  /** 建议演示顺序 */
  demoIds: readonly string[]
}

export interface CourseChapter {
  id: string
  title: string
  subject: string
  lessons: readonly CourseLesson[]
}

/** 大学物理课次包 v1（力学→电磁→波动光学→热学→近代） */
export const COURSE_PACK_V1: readonly CourseChapter[] = [
  {
    id: 'mech',
    title: '力学',
    subject: '力学',
    lessons: [
      {
        id: 'mech-kino',
        title: '运动学与抛体',
        demoIds: ['mech-projectile', 'mech-circular', 'mech-natural-frame'],
      },
      {
        id: 'mech-newton',
        title: '牛顿定律与连接体',
        demoIds: ['mech-incline', 'mech-atwood'],
      },
      {
        id: 'mech-momentum',
        title: '动量与碰撞',
        demoIds: ['mech-collision-1d', 'mech-collision-inelastic', 'mech-collision-2d', 'mech-variable-mass'],
      },
      {
        id: 'mech-osc',
        title: '振动与波',
        demoIds: [
          'mech-harmonic',
          'mech-damped',
          'mech-forced',
          'mech-coupled-osc',
          'mech-beats',
          'mech-wave-transverse',
          'mech-standing-wave',
          'mech-doppler',
        ],
      },
      {
        id: 'mech-rigid',
        title: '刚体与流体',
        demoIds: [
          'mech-rolling',
          'mech-rotation-axis',
          'mech-angular-momentum',
          'mech-physical-pendulum',
          'mech-bernoulli',
          'mech-phase-portrait',
        ],
      },
    ],
  },
  {
    id: 'em',
    title: '电磁学',
    subject: '电磁学',
    lessons: [
      {
        id: 'em-static',
        title: '静电场',
        demoIds: ['em-point-charge', 'em-potential', 'em-dipole', 'em-gauss'],
      },
      {
        id: 'em-mag',
        title: '电流磁场与洛伦兹力',
        demoIds: ['em-wire-b', 'em-loop-b', 'em-cyclotron', 'em-ampere', 'em-hall'],
      },
      {
        id: 'em-ind',
        title: '电磁感应与电路',
        demoIds: [
          'em-lenz',
          'em-motional-emf',
          'em-faraday-disk',
          'em-rc-transient',
          'em-lc',
          'em-rlc',
          'em-mutual',
        ],
      },
      {
        id: 'em-wave',
        title: '电磁波',
        demoIds: ['em-emwave', 'em-reflection', 'em-dipole-radiation', 'em-displacement', 'em-poynting'],
      },
    ],
  },
  {
    id: 'optics',
    title: '光学',
    subject: '光学',
    lessons: [
      {
        id: 'opt-geo',
        title: '几何光学与偏振',
        demoIds: ['opt-refraction', 'opt-lens', 'opt-malus', 'opt-waveplate', 'opt-brewster', 'opt-birefringence', 'opt-birefringence-snell'],
      },
      {
        id: 'opt-wave',
        title: '干涉与衍射',
        demoIds: [
          'opt-double-slit',
          'opt-thin-film',
          'opt-michelson',
          'opt-diffraction',
          'opt-grating',
          'opt-airy',
          'opt-fabry-perot',
          'opt-fresnel-zone',
        ],
      },
      {
        id: 'opt-app',
        title: '应用光学',
        demoIds: ['opt-fiber', 'opt-abbe'],
      },
    ],
  },
  {
    id: 'thermo',
    title: '热学',
    subject: '热学',
    lessons: [
      {
        id: 'th-mol',
        title: '分子动理论与气体',
        demoIds: [
          'thermo-gas',
          'thermo-maxwell',
          'thermo-mfp',
          'thermo-ideal-gas',
          'thermo-vanderwaals',
          'thermo-equipartition',
          'thermo-diffusion',
          'thermo-conduction',
        ],
      },
      {
        id: 'th-cycle',
        title: '热力学过程与循环',
        demoIds: ['thermo-pv-process', 'thermo-carnot', 'thermo-otto', 'thermo-heat-engine', 'thermo-entropy', 'thermo-phase'],
      },
    ],
  },
  {
    id: 'modern',
    title: '近代物理与量子',
    subject: '近代物理',
    lessons: [
      {
        id: 'mod-rel',
        title: '狭义相对论',
        demoIds: ['rel-minkowski', 'rel-time-dilation', 'rel-velocity-add'],
      },
      {
        id: 'mod-atom',
        title: '原子与核',
        demoIds: ['atom-bohr', 'atom-fine-structure', 'nuclear-decay'],
      },
      {
        id: 'mod-qm',
        title: '量子力学入门',
        demoIds: [
          'qm-well',
          'qm-finite-well',
          'qm-barrier',
          'qm-oscillator',
          'qm-wavepacket',
          'qm-hydrogen',
          'qm-photoelectric',
          'qm-compton',
          'qm-blackbody',
          'qm-double-slit',
          'qm-stern-gerlach',
          'qm-rabi',
          'qm-tunnel-diode',
          'qm-variational',
          'qm-alpha',
        ],
      },
    ],
  },
  {
    id: 'theo-math',
    title: '理论力学与数理方法',
    subject: '理论力学',
    lessons: [
      {
        id: 'theo',
        title: '理论力学代表',
        demoIds: [
          'theo-coriolis',
          'theo-double-pendulum',
          'theo-precession',
          'theo-centrifugal',
          'theo-foucault',
          'theo-central-force',
          'theo-lagrange-bead',
          'theo-euler-angles',
          'theo-tennis-racket',
          'theo-hamilton-phase',
        ],
      },
      {
        id: 'math',
        title: '数理方法与晶格',
        demoIds: [
          'math-fourier',
          'math-complex-surf',
          'math-spherical-harmonics',
          'math-wave-modes',
          'math-bessel',
          'math-legendre',
          'math-green',
          'lattice-mono',
          'lattice-di',
          'lattice-graphene',
        ],
      },
    ],
  },
] as const

export function flattenCourseDemoIds(pack: readonly CourseChapter[] = COURSE_PACK_V1): string[] {
  const ids: string[] = []
  for (const ch of pack) {
    for (const lesson of ch.lessons) {
      for (const id of lesson.demoIds) ids.push(id)
    }
  }
  return ids
}

/** 在课次顺序中找相邻演示（仅 liveIds 内） */
export function courseNeighbors(
  demoId: string,
  liveIds: ReadonlySet<string>,
  pack: readonly CourseChapter[] = COURSE_PACK_V1,
): { prev: string | null; next: string | null; lessonTitle: string | null } {
  const seq = flattenCourseDemoIds(pack).filter((id) => liveIds.has(id))
  const i = seq.indexOf(demoId)
  if (i < 0) return { prev: null, next: null, lessonTitle: null }
  let lessonTitle: string | null = null
  outer: for (const ch of pack) {
    for (const lesson of ch.lessons) {
      if (lesson.demoIds.includes(demoId)) {
        lessonTitle = `${ch.title} · ${lesson.title}`
        break outer
      }
    }
  }
  return {
    prev: i > 0 ? seq[i - 1]! : null,
    next: i < seq.length - 1 ? seq[i + 1]! : null,
    lessonTitle,
  }
}

export function resolveLessonDemos(
  lesson: CourseLesson,
  liveIds: ReadonlySet<string>,
): string[] {
  return lesson.demoIds.filter((id) => liveIds.has(id))
}
