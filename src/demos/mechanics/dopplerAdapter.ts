import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createParticleMesh } from '@/core/render/particle3d'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { dopplerWorldBounds, drawDopplerFrame } from './renderDoppler2d'

export function createDopplerAdapter(): DemoAdapter {
  let src: Mesh | null = null
  let rings: THREE.Group | null = null
  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawDopplerFrame(host, snap, dopplerWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.5,
        pitch: 0.7,
        distance: 14,
        distanceMin: 5,
        distanceMax: 28,
      })
      src = createParticleMesh({ radius: 0.2, color: 0xfbbf24, emissive: 0x92400e })
      rings = new THREE.Group()
      host.scene.add(src, rings)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!src || !rings) return
      src.position.set(Number(snap.values.xS ?? 0), 0, 0)
      while (rings.children.length) rings.remove(rings.children[0]!)
      const path = snap.trails?.path ?? []
      for (const r of path) {
        const geo = new THREE.RingGeometry(Math.max(0.05, r[1]! - 0.04), r[1]!, 48)
        const mesh = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.35 }),
        )
        mesh.rotation.x = -Math.PI / 2
        mesh.position.set(r[0]!, 0.02, 0)
        rings.add(mesh)
      }
      host.render()
    },
    dispose3d() {
      src = null
      rings = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
