import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import * as THREE from 'three'
import { drawSphericalHarmonicsFrame, sphericalHarmonicsWorldBounds } from './renderSphericalHarmonics2d'

export function createSphericalHarmonicsAdapter(): DemoAdapter {
  let posCloud: THREE.Points | null = null
  let negCloud: THREE.Points | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawSphericalHarmonicsFrame(host, snap, sphericalHarmonicsWorldBounds(Number(snap.values.world ?? 3.2)))
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.6,
        pitch: 0.5,
        distance: 8,
        distanceMin: 3,
        distanceMax: 16,
      })
      posCloud = new THREE.Points(
        new THREE.BufferGeometry(),
        new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.06 }),
      )
      negCloud = new THREE.Points(
        new THREE.BufferGeometry(),
        new THREE.PointsMaterial({ color: 0xf472b6, size: 0.06 }),
      )
      host.scene.add(posCloud, negCloud)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!posCloud || !negCloud) return
      const path = snap.trails?.path ?? []
      const pos: number[] = []
      const neg: number[] = []
      // subsample
      for (let i = 0; i < path.length; i += 3) {
        const p = path[i]!
        if ((p[3] ?? 1) >= 0) {
          pos.push(p[0]!, p[1]!, p[2]!)
        } else {
          neg.push(p[0]!, p[1]!, p[2]!)
        }
      }
      posCloud.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      negCloud.geometry.setAttribute('position', new THREE.Float32BufferAttribute(neg, 3))
      const yaw = (Number(snap.values.yaw ?? 0) * Math.PI) / 180
      posCloud.rotation.y = yaw * 0.15
      negCloud.rotation.y = yaw * 0.15
      host.render()
    },
    dispose3d() {
      posCloud = null
      negCloud = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
