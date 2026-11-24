import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawRcTransientFrame, rcWorldBounds } from './renderRcTransient2d'

export function createRcTransientAdapter(): DemoAdapter {
  let plate: Mesh | null = null
  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawRcTransientFrame(host, snap, rcWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.5, pitch: 0.5, distance: 8, distanceMin: 3, distanceMax: 16 })
      plate = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.08, 1.6),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 }),
      )
      host.scene.add(plate)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!plate) return
      const h = 0.1 + (Number(snap.values.Vc ?? 0) / Math.max(1, Number(snap.values.V0 ?? 5))) * 1.2
      plate.scale.y = h
      plate.position.y = h / 2
      host.render()
    },
    dispose3d() {
      plate = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
