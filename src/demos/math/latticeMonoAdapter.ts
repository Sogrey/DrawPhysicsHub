import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawLatticeMonoFrame, latticeMonoWorldBounds } from './renderLatticeMono2d'

export function createLatticeMonoAdapter(): DemoAdapter {
  let atoms: Mesh[] = []
  let group: THREE.Group | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawLatticeMonoFrame(host, snap, latticeMonoWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [7, 0, 0],
        yaw: 0.4,
        pitch: 0.5,
        distance: 14,
        distanceMin: 6,
        distanceMax: 28,
      })
      group = new THREE.Group()
      atoms = []
      for (let i = 0; i < 16; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8 }),
        )
        atoms.push(m)
        group.add(m)
      }
      host.scene.add(group)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      const path = snap.trails?.path
      if (!path) return
      for (let i = 0; i < atoms.length && i < path.length; i++) {
        atoms[i]!.position.set(path[i]![0]!, 0, 0)
      }
      host.render()
    },
    dispose3d() {
      atoms = []
      group = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
