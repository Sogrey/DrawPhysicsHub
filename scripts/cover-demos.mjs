/**
 * 封面抓取共用清单（capture-covers / save-cdp-cover / list-demos 交叉核对）。
 * 新增演示时：这里补 id + subject，并同步 LIVE_COVERS + public/covers/<id>.png。
 */
export const COVER_DEMOS = [
  { id: 'mech-projectile', subject: '力学' },
  { id: 'mech-collision-1d', subject: '力学' },
  { id: 'mech-harmonic', subject: '力学' },
  { id: 'mech-damped', subject: '力学' },
  { id: 'mech-forced', subject: '力学' },
  { id: 'mech-pendulum', subject: '力学' },
  { id: 'mech-circular', subject: '力学' },
  { id: 'mech-natural-frame', subject: '力学' },
  { id: 'mech-incline', subject: '力学' },
  { id: 'mech-rolling', subject: '力学' },
  { id: 'mech-rotation-axis', subject: '力学' },
  { id: 'mech-wave-transverse', subject: '力学' },
  { id: 'mech-standing-wave', subject: '力学' },
  { id: 'mech-energy-curve', subject: '力学' },
  { id: 'mech-angular-momentum', subject: '力学' },
  { id: 'em-point-charge', subject: '电磁学' },
  { id: 'em-potential', subject: '电磁学' },
  { id: 'em-dipole', subject: '电磁学' },
  { id: 'em-wire-b', subject: '电磁学' },
  { id: 'em-loop-b', subject: '电磁学' },
  { id: 'em-cyclotron', subject: '电磁学' },
  { id: 'em-ampere', subject: '电磁学' },
  { id: 'em-lenz', subject: '电磁学' },
  { id: 'em-motional-emf', subject: '电磁学' },
  { id: 'em-emwave', subject: '电磁学' },
  { id: 'em-reflection', subject: '电磁学' },
  { id: 'em-dipole-radiation', subject: '电磁学' },
  { id: 'em-displacement', subject: '电磁学' },
  { id: 'thermo-gas', subject: '热学' },
  { id: 'thermo-carnot', subject: '热学' },
  { id: 'thermo-maxwell', subject: '热学' },
  { id: 'thermo-pv-process', subject: '热学' },
  { id: 'thermo-mfp', subject: '热学' },
  { id: 'thermo-ideal-gas', subject: '热学' },
  { id: 'thermo-diffusion', subject: '热学' },
  { id: 'thermo-entropy', subject: '热学' },
  { id: 'qm-well', subject: '量子力学' },
  { id: 'qm-barrier', subject: '量子力学' },
  { id: 'qm-oscillator', subject: '量子力学' },
  { id: 'qm-photoelectric', subject: '量子力学' },
  { id: 'qm-compton', subject: '量子力学' },
  { id: 'qm-blackbody', subject: '量子力学' },
  { id: 'qm-double-slit', subject: '量子力学' },
  { id: 'qm-alpha', subject: '量子力学' },
  { id: 'theo-coriolis', subject: '理论力学' },
  { id: 'theo-double-pendulum', subject: '理论力学' },
  { id: 'theo-precession', subject: '理论力学' },
  { id: 'theo-centrifugal', subject: '理论力学' },
  { id: 'theo-foucault', subject: '理论力学' },
  { id: 'theo-central-force', subject: '理论力学' },
  { id: 'theo-lagrange-bead', subject: '理论力学' },
  { id: 'opt-double-slit', subject: '光学' },
  { id: 'opt-diffraction', subject: '光学' },
  { id: 'opt-malus', subject: '光学' },
  { id: 'opt-waveplate', subject: '光学' },
  { id: 'opt-refraction', subject: '光学' },
  { id: 'opt-lens', subject: '光学' },
  { id: 'opt-thin-film', subject: '光学' },
  { id: 'opt-grating', subject: '光学' },
  { id: 'opt-birefringence', subject: '光学' },
  { id: 'opt-birefringence-snell', subject: '光学' },
  { id: 'opt-brewster', subject: '光学' },
  { id: 'math-fourier', subject: '数理方法' },
  { id: 'math-complex-surf', subject: '数理方法' },
  { id: 'math-spherical-harmonics', subject: '数理方法' },
  { id: 'math-wave-modes', subject: '数理方法' },
  { id: 'lattice-mono', subject: '数理方法' },
  { id: 'lattice-di', subject: '数理方法' },
  { id: 'lattice-graphene', subject: '数理方法' },
  { id: 'mech-collision-inelastic', subject: '力学' },
  { id: 'mech-coupled-osc', subject: '力学' },
  { id: 'mech-beats', subject: '力学' },
  { id: 'mech-doppler', subject: '力学' },
  { id: 'mech-physical-pendulum', subject: '力学' },
  { id: 'em-rc-transient', subject: '电磁学' },
  { id: 'em-rlc', subject: '电磁学' },
  { id: 'em-mutual', subject: '电磁学' },
  { id: 'em-gauss', subject: '电磁学' },
  { id: 'opt-michelson', subject: '光学' },
  { id: 'opt-airy', subject: '光学' },
  { id: 'opt-fabry-perot', subject: '光学' },
  { id: 'thermo-conduction', subject: '热学' },
  { id: 'thermo-heat-engine', subject: '热学' },
  { id: 'thermo-phase', subject: '热学' },
  { id: 'qm-finite-well', subject: '量子力学' },
  { id: 'qm-wavepacket', subject: '量子力学' },
  { id: 'qm-stern-gerlach', subject: '量子力学' },
  { id: 'qm-hydrogen', subject: '量子力学' },
  { id: 'rel-minkowski', subject: '近代物理' },
  { id: 'rel-time-dilation', subject: '近代物理' },
  { id: 'atom-bohr', subject: '近代物理' },
  { id: 'mech-atwood', subject: '力学' },
  { id: 'mech-variable-mass', subject: '力学' },
  { id: 'mech-collision-2d', subject: '力学' },
  { id: 'mech-phase-portrait', subject: '力学' },
  { id: 'mech-bernoulli', subject: '力学' },
  { id: 'em-hall', subject: '电磁学' },
  { id: 'em-lc', subject: '电磁学' },
  { id: 'em-poynting', subject: '电磁学' },
  { id: 'em-faraday-disk', subject: '电磁学' },
  { id: 'opt-fresnel-zone', subject: '光学' },
  { id: 'opt-fiber', subject: '光学' },
  { id: 'opt-abbe', subject: '光学' },
  { id: 'thermo-vanderwaals', subject: '热学' },
  { id: 'thermo-otto', subject: '热学' },
  { id: 'thermo-equipartition', subject: '热学' },
  { id: 'qm-rabi', subject: '量子力学' },
  { id: 'qm-tunnel-diode', subject: '量子力学' },
  { id: 'qm-variational', subject: '量子力学' },
  { id: 'theo-euler-angles', subject: '理论力学' },
  { id: 'theo-tennis-racket', subject: '理论力学' },
  { id: 'theo-hamilton-phase', subject: '理论力学' },
  { id: 'math-bessel', subject: '数理方法' },
  { id: 'math-legendre', subject: '数理方法' },
  { id: 'math-green', subject: '数理方法' },
  { id: 'rel-velocity-add', subject: '近代物理' },
  { id: 'atom-fine-structure', subject: '近代物理' },
  { id: 'nuclear-decay', subject: '近代物理' },
]

/** M7 扩包新增（便于只重抓这一批） */
export const M7_COVER_IDS = [
  'thermo-maxwell',
  'thermo-pv-process',
  'thermo-mfp',
  'thermo-ideal-gas',
  'thermo-diffusion',
  'thermo-entropy',
  'qm-barrier',
  'qm-oscillator',
  'qm-photoelectric',
  'qm-compton',
  'qm-blackbody',
  'qm-double-slit',
  'qm-alpha',
]

/** M8-A 理论力学批次 */
export const M8A_COVER_IDS = [
  'theo-double-pendulum',
  'theo-precession',
  'theo-centrifugal',
  'theo-foucault',
  'theo-central-force',
  'theo-lagrange-bead',
]

/** M8-B 电动力学 / 光学进阶 */
export const M8B_COVER_IDS = [
  'em-emwave',
  'em-reflection',
  'em-dipole-radiation',
  'em-displacement',
  'opt-birefringence-snell',
  'opt-brewster',
]

/** M8-C 数理方法 / 晶格 */
export const M8C_COVER_IDS = [
  'math-fourier',
  'math-complex-surf',
  'math-spherical-harmonics',
  'math-wave-modes',
  'lattice-mono',
  'lattice-di',
  'lattice-graphene',
]

/** M8-D 既有科目补洞 */
export const M8D_COVER_IDS = [
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
]

/** M8-Rel 近代物理入门 */
export const M8REL_COVER_IDS = [
  'rel-minkowski',
  'rel-time-dilation',
  'atom-bohr',
]

/** M8-F 力学（首批） */
export const M8F_MECH_COVER_IDS = [
  'mech-atwood',
  'mech-variable-mass',
  'mech-collision-2d',
  'mech-phase-portrait',
  'mech-bernoulli',
]

/** M8-F 电磁 */
export const M8F_EM_COVER_IDS = ['em-hall', 'em-lc', 'em-poynting', 'em-faraday-disk']

/** M8-F 光学 / 热学 / 量子 */
export const M8F_OTQ_COVER_IDS = [
  'opt-fresnel-zone',
  'opt-fiber',
  'opt-abbe',
  'thermo-vanderwaals',
  'thermo-otto',
  'thermo-equipartition',
  'qm-rabi',
  'qm-tunnel-diode',
  'qm-variational',
]

/** M8-F 理论 / 数理 / 近代续扩 */
export const M8F_REST_COVER_IDS = [
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

export function isKnownCoverId(id) {
  return COVER_DEMOS.some((d) => d.id === id)
}

export function subjectForCoverId(id) {
  return COVER_DEMOS.find((d) => d.id === id)?.subject
}
