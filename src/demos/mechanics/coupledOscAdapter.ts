import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createParticleMesh } from '@/core/render/particle3d'
import type { Mesh } from 'three'
import { coupledOscWorldBounds, drawCoupledOscFrame } from './renderCoupledOsc2d'

export function createCoupledOscAdapter(): DemoAdapter {
  let a: Mesh | null = null
  let b: Mesh | null = null
  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawCoupledOscFrame(host, snap, coupledOscWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.4,
        pitch: 0.45,
        distance: 10,
        distanceMin: 4,
        distanceMax: 20,
      })
      a = createParticleMesh({ radius: 0.22, color: 0x38bdf8, emissive: 0x0c4a6e })
      b = createParticleMesh({ radius: 0.22, color: 0xf472b6, emissive: 0x831843 })
      host.scene.add(a, b)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!a || !b) return
      a.position.set(Number(snap.values.x1 ?? 0) - 1.2, 0, 0)
      b.position.set(Number(snap.values.x2 ?? 0) + 1.2, 0, 0)
      host.render()
    },
    dispose3d() {
      a = null
      b = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
