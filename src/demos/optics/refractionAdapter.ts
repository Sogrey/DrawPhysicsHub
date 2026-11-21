import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawRefractionFrame, refractionWorldBounds } from './renderRefraction2d'

export function createRefractionAdapter(): DemoAdapter {
  let plane: Mesh | null = null
  let incident: THREE.ArrowHelper | null = null
  let reflected: THREE.ArrowHelper | null = null
  let refracted: THREE.ArrowHelper | null = null
  let normal: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 5)
      drawRefractionFrame(host, snap, refractionWorldBounds(world))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.55,
        pitch: 0.55,
        distance: 10,
        distanceMin: 4,
        distanceMax: 24,
      })

      plane = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshStandardMaterial({
          color: 0x334155,
          metalness: 0.1,
          roughness: 0.85,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
        }),
      )
      plane.rotation.x = -Math.PI / 2

      const nPts = [new THREE.Vector3(0, -2.5, 0), new THREE.Vector3(0, 2.5, 0)]
      normal = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(nPts),
        new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.15, gapSize: 0.1 }),
      )
      normal.computeLineDistances()

      incident = new THREE.ArrowHelper(
        new THREE.Vector3(1, -1, 0).normalize(),
        new THREE.Vector3(-2, 2, 0),
        2.8,
        0x4ade80,
        0.25,
        0.14,
      )
      reflected = new THREE.ArrowHelper(
        new THREE.Vector3(1, 1, 0).normalize(),
        new THREE.Vector3(0, 0, 0),
        2.5,
        0xfbbf24,
        0.25,
        0.14,
      )
      refracted = new THREE.ArrowHelper(
        new THREE.Vector3(1, -1, 0).normalize(),
        new THREE.Vector3(0, 0, 0),
        2.5,
        0x38bdf8,
        0.25,
        0.14,
      )

      host.scene.add(plane)
      host.scene.add(normal)
      host.scene.add(incident)
      host.scene.add(reflected)
      host.scene.add(refracted)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!incident || !reflected || !refracted) return
      const theta1 = (Number(snap.values.theta1 ?? 0) * Math.PI) / 180
      const theta2 = (Number(snap.values.theta2 ?? 0) * Math.PI) / 180
      const tir = Number(snap.values.tir ?? 0) > 0.5
      const L = 2.6

      // incident from up-left toward origin
      const ix = -Math.sin(theta1) * L
      const iy = Math.cos(theta1) * L
      incident.position.set(ix, iy, 0)
      incident.setDirection(new THREE.Vector3(-ix, -iy, 0).normalize())
      incident.setLength(L, 0.25, 0.14)

      // reflected up-right
      reflected.position.set(0, 0, 0)
      reflected.setDirection(new THREE.Vector3(Math.sin(theta1), Math.cos(theta1), 0).normalize())
      reflected.setLength(L * 0.95, 0.25, 0.14)

      if (tir) {
        refracted.visible = false
      } else {
        refracted.visible = true
        refracted.position.set(0, 0, 0)
        refracted.setDirection(
          new THREE.Vector3(Math.sin(theta2), -Math.cos(theta2), 0).normalize(),
        )
        refracted.setLength(L * 0.95, 0.25, 0.14)
      }

      host.render()
    },

    dispose3d() {
      plane = null
      incident = null
      reflected = null
      refracted = null
      normal = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
