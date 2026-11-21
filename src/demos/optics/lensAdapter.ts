import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Object3D } from 'three'
import * as THREE from 'three'
import { drawLensFrame, lensWorldBounds } from './renderLens2d'

export function createLensAdapter(): DemoAdapter {
  let lens: Object3D | null = null
  let objArrow: THREE.ArrowHelper | null = null
  let imgArrow: THREE.ArrowHelper | null = null
  let axis: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const u = Number(snap.values.u ?? 4)
      const v = Number(snap.values.v ?? 4)
      const f = Number(snap.values.f ?? 2)
      drawLensFrame(host, snap, lensWorldBounds(u, v, f))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.4, 0],
        yaw: 0.45,
        pitch: 0.35,
        distance: 14,
        distanceMin: 6,
        distanceMax: 30,
      })

      lens = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 32, 24, 0, Math.PI * 2, 0, Math.PI),
        new THREE.MeshStandardMaterial({
          color: 0xa78bfa,
          transparent: true,
          opacity: 0.35,
          metalness: 0.1,
          roughness: 0.4,
          side: THREE.DoubleSide,
        }),
      )
      lens.scale.set(0.25, 1.4, 1.4)

      const axisPts = [new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)]
      axis = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(axisPts),
        new THREE.LineBasicMaterial({ color: 0x94a3b8 }),
      )

      objArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(-4, 0, 0),
        1.2,
        0x4ade80,
        0.25,
        0.15,
      )
      imgArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(4, 0, 0),
        1.2,
        0x38bdf8,
        0.25,
        0.15,
      )

      host.scene.add(lens)
      host.scene.add(axis)
      host.scene.add(objArrow)
      host.scene.add(imgArrow)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!objArrow || !imgArrow) return
      const u = Number(snap.values.u ?? 4)
      const v = Number(snap.values.v ?? 4)
      const hObj = Number(snap.values.hObj ?? 1.2)
      const hImg = Number(snap.values.hImg ?? 0)
      const finite = Number(snap.values.finite ?? 1) > 0.5
      const real = Number(snap.values.real ?? 1) > 0.5

      objArrow.position.set(-u, 0, 0)
      objArrow.setDirection(new THREE.Vector3(0, 1, 0))
      objArrow.setLength(Math.max(0.3, hObj), 0.22, 0.12)

      if (finite) {
        imgArrow.visible = true
        imgArrow.position.set(v, 0, 0)
        const dir = hImg >= 0 ? 1 : -1
        imgArrow.setDirection(new THREE.Vector3(0, dir, 0))
        imgArrow.setLength(Math.max(0.25, Math.abs(hImg)), 0.22, 0.12)
        ;(imgArrow.line.material as THREE.LineBasicMaterial).opacity = real ? 1 : 0.45
      } else {
        imgArrow.visible = false
      }

      host.render()
    },

    dispose3d() {
      lens = null
      objArrow = null
      imgArrow = null
      axis = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
