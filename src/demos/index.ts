import { registerCircularDemo } from './mechanics/circular'
import { registerCollisionDemo } from './mechanics/collision'
import { registerCollisionInelasticDemo } from './mechanics/collisionInelastic'
import { registerCoupledOscDemo } from './mechanics/coupledOsc'
import { registerBeatsDemo } from './mechanics/beats'
import { registerDopplerDemo } from './mechanics/doppler'
import { registerPhysicalPendulumDemo } from './mechanics/physicalPendulum'
import { registerAtwoodDemo } from './mechanics/atwood'
import { registerVariableMassDemo } from './mechanics/variableMass'
import { registerCollision2dDemo } from './mechanics/collision2d'
import { registerPhasePortraitDemo } from './mechanics/phasePortrait'
import { registerBernoulliDemo } from './mechanics/bernoulli'
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
import { registerEmWaveDemo } from './em/emWave'
import { registerEmReflectionDemo } from './em/emReflection'
import { registerDipoleRadiationDemo } from './em/dipoleRadiation'
import { registerDisplacementDemo } from './em/displacement'
import { registerRcTransientDemo } from './em/rcTransient'
import { registerRlcDemo } from './em/rlc'
import { registerMutualDemo } from './em/mutual'
import { registerGaussDemo } from './em/gauss'
import { registerHallDemo } from './em/hall'
import { registerLcDemo } from './em/lc'
import { registerPoyntingDemo } from './em/poynting'
import { registerFaradayDiskDemo } from './em/faradayDisk'
import { registerGasDemo } from './thermo/gas'
import { registerCarnotDemo } from './thermo/carnot'
import { registerMaxwellDemo } from './thermo/maxwell'
import { registerPvProcessDemo } from './thermo/pvProcess'
import { registerMfpDemo } from './thermo/mfp'
import { registerIdealGasDemo } from './thermo/idealGas'
import { registerDiffusionDemo } from './thermo/diffusion'
import { registerEntropyDemo } from './thermo/entropy'
import { registerConductionDemo } from './thermo/conduction'
import { registerHeatEngineDemo } from './thermo/heatEngine'
import { registerPhaseDemo } from './thermo/phase'
import { registerVanderWaalsDemo } from './thermo/vanderWaals'
import { registerOttoDemo } from './thermo/otto'
import { registerEquipartitionDemo } from './thermo/equipartition'
import { registerWellDemo } from './qm/well'
import { registerBarrierDemo } from './qm/barrier'
import { registerOscillatorDemo } from './qm/oscillator'
import { registerPhotoelectricDemo } from './qm/photoelectric'
import { registerComptonDemo } from './qm/compton'
import { registerBlackbodyDemo } from './qm/blackbody'
import { registerQmDoubleSlitDemo } from './qm/doubleSlit'
import { registerAlphaDemo } from './qm/alpha'
import { registerFiniteWellDemo } from './qm/finiteWell'
import { registerWavepacketDemo } from './qm/wavepacket'
import { registerSternGerlachDemo } from './qm/sternGerlach'
import { registerHydrogenDemo } from './qm/hydrogen'
import { registerRabiDemo } from './qm/rabi'
import { registerTunnelDiodeDemo } from './qm/tunnelDiode'
import { registerVariationalDemo } from './qm/variational'
import { registerCoriolisDemo } from './theo/coriolis'
import { registerDoublePendulumDemo } from './theo/doublePendulum'
import { registerPrecessionDemo } from './theo/precession'
import { registerCentrifugalDemo } from './theo/centrifugal'
import { registerFoucaultDemo } from './theo/foucault'
import { registerCentralForceDemo } from './theo/centralForce'
import { registerLagrangeBeadDemo } from './theo/lagrangeBead'
import { registerEulerAnglesDemo } from './theo/eulerAngles'
import { registerTennisRacketDemo } from './theo/tennisRacket'
import { registerHamiltonPhaseDemo } from './theo/hamiltonPhase'
import { registerDoubleSlitDemo } from './optics/doubleSlit'
import { registerDiffractionDemo } from './optics/diffraction'
import { registerMalusDemo } from './optics/malus'
import { registerWaveplateDemo } from './optics/waveplate'
import { registerRefractionDemo } from './optics/refraction'
import { registerLensDemo } from './optics/lens'
import { registerThinFilmDemo } from './optics/thinFilm'
import { registerGratingDemo } from './optics/grating'
import { registerBirefringenceDemo } from './optics/birefringence'
import { registerBirefringenceSnellDemo } from './optics/birefringenceSnell'
import { registerBrewsterDemo } from './optics/brewster'
import { registerMichelsonDemo } from './optics/michelson'
import { registerAiryDemo } from './optics/airy'
import { registerFabryPerotDemo } from './optics/fabryPerot'
import { registerFresnelZoneDemo } from './optics/fresnelZone'
import { registerFiberDemo } from './optics/fiber'
import { registerAbbeDemo } from './optics/abbe'
import { registerFourierDemo } from './math/fourier'
import { registerComplexSurfDemo } from './math/complexSurf'
import { registerSphericalHarmonicsDemo } from './math/sphericalHarmonics'
import { registerWaveModesDemo } from './math/waveModes'
import { registerLatticeMonoDemo } from './math/latticeMono'
import { registerLatticeDiDemo } from './math/latticeDi'
import { registerLatticeGrapheneDemo } from './math/latticeGraphene'
import { registerBesselDemo } from './math/bessel'
import { registerLegendreDemo } from './math/legendre'
import { registerGreen1dDemo } from './math/green1d'
import { registerMinkowskiDemo } from './rel/minkowski'
import { registerTimeDilationDemo } from './rel/timeDilation'
import { registerBohrDemo } from './rel/bohr'
import { registerVelocityAddDemo } from './rel/velocityAdd'
import { registerFineStructureDemo } from './rel/fineStructure'
import { registerNuclearDecayDemo } from './rel/nuclearDecay'

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
  registerCollisionInelasticDemo()
  registerCoupledOscDemo()
  registerBeatsDemo()
  registerDopplerDemo()
  registerPhysicalPendulumDemo()
  registerAtwoodDemo()
  registerVariableMassDemo()
  registerCollision2dDemo()
  registerPhasePortraitDemo()
  registerBernoulliDemo()
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
  registerEmWaveDemo()
  registerEmReflectionDemo()
  registerDipoleRadiationDemo()
  registerDisplacementDemo()
  registerRcTransientDemo()
  registerRlcDemo()
  registerMutualDemo()
  registerGaussDemo()
  registerHallDemo()
  registerLcDemo()
  registerPoyntingDemo()
  registerFaradayDiskDemo()
  registerGasDemo()
  registerCarnotDemo()
  registerMaxwellDemo()
  registerPvProcessDemo()
  registerMfpDemo()
  registerIdealGasDemo()
  registerDiffusionDemo()
  registerEntropyDemo()
  registerConductionDemo()
  registerHeatEngineDemo()
  registerPhaseDemo()
  registerVanderWaalsDemo()
  registerOttoDemo()
  registerEquipartitionDemo()
  registerWellDemo()
  registerBarrierDemo()
  registerOscillatorDemo()
  registerPhotoelectricDemo()
  registerComptonDemo()
  registerBlackbodyDemo()
  registerQmDoubleSlitDemo()
  registerAlphaDemo()
  registerFiniteWellDemo()
  registerWavepacketDemo()
  registerSternGerlachDemo()
  registerHydrogenDemo()
  registerRabiDemo()
  registerTunnelDiodeDemo()
  registerVariationalDemo()
  registerCoriolisDemo()
  registerDoublePendulumDemo()
  registerPrecessionDemo()
  registerCentrifugalDemo()
  registerFoucaultDemo()
  registerCentralForceDemo()
  registerLagrangeBeadDemo()
  registerEulerAnglesDemo()
  registerTennisRacketDemo()
  registerHamiltonPhaseDemo()
  registerDoubleSlitDemo()
  registerDiffractionDemo()
  registerMalusDemo()
  registerWaveplateDemo()
  registerRefractionDemo()
  registerLensDemo()
  registerThinFilmDemo()
  registerGratingDemo()
  registerBirefringenceDemo()
  registerBirefringenceSnellDemo()
  registerBrewsterDemo()
  registerMichelsonDemo()
  registerAiryDemo()
  registerFabryPerotDemo()
  registerFresnelZoneDemo()
  registerFiberDemo()
  registerAbbeDemo()
  registerFourierDemo()
  registerComplexSurfDemo()
  registerSphericalHarmonicsDemo()
  registerWaveModesDemo()
  registerLatticeMonoDemo()
  registerLatticeDiDemo()
  registerLatticeGrapheneDemo()
  registerBesselDemo()
  registerLegendreDemo()
  registerGreen1dDemo()
  registerMinkowskiDemo()
  registerTimeDilationDemo()
  registerBohrDemo()
  registerVelocityAddDemo()
  registerFineStructureDemo()
  registerNuclearDecayDemo()
}
