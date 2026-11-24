import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawLatticeGrapheneFrame, latticeGrapheneWorldBounds } from './renderLatticeGraphene2d'

export function createLatticeGrapheneAdapter(): DemoAdapter {
  let atoms: Mesh[] = []

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawLatticeGrapheneFrame(host, snap, latticeGrapheneWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.55,
        pitch: 0.75,
        distance: 10,
        distanceMin: 4,
        distanceMax: 20,
      })
      atoms = []
      for (let i = 0; i < 50; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8 }),
        )
        atoms.push(m)
        host.scene.add(m)
      }
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      const path = snap.trails?.path
      if (!path) return
      for (let i = 0; i < atoms.length; i++) {
        const p = path[i]
        if (!p) {
          atoms[i]!.visible = false
          continue
        }
        atoms[i]!.visible = true
        const mat = atoms[i]!.material as THREE.MeshStandardMaterial
        mat.color.set((p[2] ?? 0) < 0.5 ? 0x38bdf8 : 0xf472b6)
        atoms[i]!.position.set(p[0]!, 0, p[1]!)
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
