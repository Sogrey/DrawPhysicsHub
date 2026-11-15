import { registerCircularDemo } from './mechanics/circular'
import { registerCollisionDemo } from './mechanics/collision'
import { registerDampedDemo } from './mechanics/damped'
import { registerForcedDemo } from './mechanics/forced'
import { registerHarmonicDemo } from './mechanics/harmonic'
import { registerInclineDemo } from './mechanics/incline'
import { registerPendulumDemo } from './mechanics/pendulum'
import { registerProjectileDemo } from './mechanics/projectile'
import { registerRollingDemo } from './mechanics/rolling'

/** Register all built-in demos */
export function registerAllDemos(): void {
  registerProjectileDemo()
  registerCircularDemo()
  registerInclineDemo()
  registerHarmonicDemo()
  registerDampedDemo()
  registerForcedDemo()
  registerPendulumDemo()
  registerCollisionDemo()
  registerRollingDemo()
}
