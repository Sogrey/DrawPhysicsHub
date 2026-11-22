import { registerCircularDemo } from './mechanics/circular'
import { registerCollisionDemo } from './mechanics/collision'
import { registerDampedDemo } from './mechanics/damped'
import { registerForcedDemo } from './mechanics/forced'
import { registerHarmonicDemo } from './mechanics/harmonic'
import { registerInclineDemo } from './mechanics/incline'
import { registerNaturalFrameDemo } from './mechanics/naturalFrame'
import { registerPendulumDemo } from './mechanics/pendulum'
import { registerProjectileDemo } from './mechanics/projectile'
import { registerRollingDemo } from './mechanics/rolling'
import { registerRotationAxisDemo } from './mechanics/rotationAxis'
import { registerAngularMomentumDemo } from './mechanics/angularMomentum'
import { registerEnergyCurveDemo } from './mechanics/energyCurve'
import { registerStandingWaveDemo } from './mechanics/standingWave'
import { registerWaveTransverseDemo } from './mechanics/waveTransverse'
import { registerPointChargeDemo } from './em/pointCharge'
import { registerPotentialDemo } from './em/potential'
import { registerDipoleDemo } from './em/dipole'
import { registerWireBDemo } from './em/wireB'
import { registerLoopBDemo } from './em/loopB'
import { registerCyclotronDemo } from './em/cyclotron'
import { registerAmpereDemo } from './em/ampere'
import { registerLenzDemo } from './em/lenz'
import { registerMotionalEmfDemo } from './em/motionalEmf'
import { registerGasDemo } from './thermo/gas'
import { registerCarnotDemo } from './thermo/carnot'
import { registerWellDemo } from './qm/well'
import { registerCoriolisDemo } from './theo/coriolis'
import { registerDoubleSlitDemo } from './optics/doubleSlit'
import { registerDiffractionDemo } from './optics/diffraction'
import { registerMalusDemo } from './optics/malus'
import { registerWaveplateDemo } from './optics/waveplate'
import { registerRefractionDemo } from './optics/refraction'
import { registerLensDemo } from './optics/lens'
import { registerThinFilmDemo } from './optics/thinFilm'
import { registerGratingDemo } from './optics/grating'
import { registerBirefringenceDemo } from './optics/birefringence'

/** Register all built-in demos */
export function registerAllDemos(): void {
  registerProjectileDemo()
  registerCircularDemo()
  registerNaturalFrameDemo()
  registerInclineDemo()
  registerHarmonicDemo()
  registerDampedDemo()
  registerForcedDemo()
  registerPendulumDemo()
  registerCollisionDemo()
  registerRollingDemo()
  registerRotationAxisDemo()
  registerWaveTransverseDemo()
  registerStandingWaveDemo()
  registerEnergyCurveDemo()
  registerAngularMomentumDemo()
  registerPointChargeDemo()
  registerPotentialDemo()
  registerDipoleDemo()
  registerWireBDemo()
  registerLoopBDemo()
  registerCyclotronDemo()
  registerAmpereDemo()
  registerLenzDemo()
  registerMotionalEmfDemo()
  registerGasDemo()
  registerCarnotDemo()
  registerWellDemo()
  registerCoriolisDemo()
  registerDoubleSlitDemo()
  registerDiffractionDemo()
  registerMalusDemo()
  registerWaveplateDemo()
  registerRefractionDemo()
  registerLensDemo()
  registerThinFilmDemo()
  registerGratingDemo()
  registerBirefringenceDemo()
}
