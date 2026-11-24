import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawEmReflectionFrame, emReflectionWorldBounds } from './renderEmReflection2d'

export function createEmReflectionAdapter(): DemoAdapter {
  let slab: Mesh | null = null
  let ei: THREE.ArrowHelper | null = null
  let er: THREE.ArrowHelper | null = null
  let et: THREE.ArrowHelper | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawEmReflectionFrame(host, snap, emReflectionWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.5,
        pitch: 0.55,
        distance: 10,
        distanceMin: 4,
        distanceMax: 20,
      })
      slab = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 4, 4),
        new THREE.MeshStandardMaterial({ color: 0x475569, transparent: true, opacity: 0.5 }),
      )
      ei = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1.5, 0, 0), 1, 0x38bdf8, 0.2, 0.1)
      er = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1.8, 0, 0), 1, 0xf472b6, 0.2, 0.1)
      et = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1.2, 0, 0), 1, 0x4ade80, 0.2, 0.1)
      host.scene.add(slab, ei, er, et)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!ei || !er || !et) return
      const Ei = Number(snap.values.Ei ?? 0)
      const Er = Number(snap.values.Er ?? 0)
      const Et = Number(snap.values.Et ?? 0)
      const len = (v: number) => Math.max(0.15, Math.abs(v) * 1.8)
      ei.setLength(len(Ei), 0.18, 0.1)
      ei.setDirection(new THREE.Vector3(0, Math.sign(Ei) || 1, 0))
      er.setLength(len(Er), 0.18, 0.1)
      er.setDirection(new THREE.Vector3(0, Math.sign(Er) || 1, 0))
      et.setLength(len(Et), 0.18, 0.1)
      et.setDirection(new THREE.Vector3(0, Math.sign(Et) || 1, 0))
      host.render()
    },
    dispose3d() {
      slab = null
      ei = null
      er = null
      et = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
