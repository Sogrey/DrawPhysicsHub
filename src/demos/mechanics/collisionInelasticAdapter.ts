import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createParticleMesh } from '@/core/render/particle3d'
import type { Mesh } from 'three'
import {
  collisionInelasticWorldBounds,
  drawCollisionInelasticFrame,
} from './renderCollisionInelastic2d'

export function createCollisionInelasticAdapter(): DemoAdapter {
  let b1: Mesh | null = null
  let b2: Mesh | null = null
  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawCollisionInelasticFrame(host, snap, collisionInelasticWorldBounds(snap))
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.4, 0],
        yaw: 0.4,
        pitch: 0.35,
        distance: 16,
        distanceMin: 6,
        distanceMax: 40,
      })
      b1 = createParticleMesh({ radius: 0.45, color: 0x38bdf8, emissive: 0x0c4a6e })
      b2 = createParticleMesh({ radius: 0.5, color: 0xf97316, emissive: 0x7c2d12 })
      host.scene.add(b1, b2)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!b1 || !b2) return
      b1.position.set(Number(snap.values.x1 ?? 0), Number(snap.values.r1 ?? 0.4), 0)
      b2.position.set(Number(snap.values.x2 ?? 0), Number(snap.values.r2 ?? 0.4), 0)
      host.render()
    },
    dispose3d() {
      b1 = null
      b2 = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
