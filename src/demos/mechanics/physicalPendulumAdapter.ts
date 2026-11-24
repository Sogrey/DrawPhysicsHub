import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import * as THREE from 'three'
import {
  drawPhysicalPendulumFrame,
  physicalPendulumWorldBounds,
} from './renderPhysicalPendulum2d'

export function createPhysicalPendulumAdapter(): DemoAdapter {
  let rod: THREE.Mesh | null = null
  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawPhysicalPendulumFrame(host, snap, physicalPendulumWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, -0.6, 0],
        yaw: 0.4,
        pitch: 0.45,
        distance: 8,
        distanceMin: 3,
        distanceMax: 16,
      })
      rod = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 2, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xa78bfa }),
      )
      host.scene.add(rod)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!rod) return
      const th = (Number(snap.values.theta ?? 0) * Math.PI) / 180
      const pivot = Number(snap.values.pivot ?? 0.3)
      const L = Number(snap.values.L ?? 2)
      rod.rotation.z = -th
      // center of rod relative pivot
      const cy = -(L / 2 - pivot)
      rod.position.set(cy * Math.sin(th), cy * Math.cos(th), 0)
      host.render()
    },
    dispose3d() {
      rod = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
