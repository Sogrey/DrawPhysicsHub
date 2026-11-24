import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawLatticeDiFrame, latticeDiWorldBounds } from './renderLatticeDi2d'

export function createLatticeDiAdapter(): DemoAdapter {
  let atoms: Mesh[] = []

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawLatticeDiFrame(host, snap, latticeDiWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [8, 0, 0],
        yaw: 0.4,
        pitch: 0.5,
        distance: 16,
        distanceMin: 6,
        distanceMax: 30,
      })
      atoms = []
      for (let i = 0; i < 20; i++) {
        const heavy = i % 2 === 1
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(heavy ? 0.22 : 0.14, 10, 10),
          new THREE.MeshStandardMaterial({ color: heavy ? 0xf472b6 : 0x38bdf8 }),
        )
        atoms.push(m)
        host.scene.add(m)
      }
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      const path = snap.trails?.path
      if (!path) return
      for (let i = 0; i < atoms.length && i < path.length; i++) {
        atoms[i]!.position.set(path[i]![0]!, path[i]![1] ?? 0, 0)
      }
      host.render()
    },
    dispose3d() {
      atoms = []
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
