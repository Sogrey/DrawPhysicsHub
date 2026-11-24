import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { birefringenceSnellWorldBounds, drawBirefringenceSnellFrame } from './renderBirefringenceSnell2d'

export function createBirefringenceSnellAdapter(): DemoAdapter {
  let plane: Mesh | null = null
  let incident: THREE.ArrowHelper | null = null
  let oRay: THREE.ArrowHelper | null = null
  let eRay: THREE.ArrowHelper | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawBirefringenceSnellFrame(host, snap, birefringenceSnellWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.55,
        pitch: 0.5,
        distance: 10,
        distanceMin: 4,
        distanceMax: 20,
      })
      plane = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshStandardMaterial({
          color: 0x334155,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        }),
      )
      plane.rotation.x = -Math.PI / 2
      incident = new THREE.ArrowHelper(new THREE.Vector3(1, -1, 0).normalize(), new THREE.Vector3(-2, 2, 0), 2.8, 0x4ade80, 0.2, 0.1)
      oRay = new THREE.ArrowHelper(new THREE.Vector3(1, -1, 0).normalize(), new THREE.Vector3(0, 0, 0), 2.5, 0x38bdf8, 0.2, 0.1)
      eRay = new THREE.ArrowHelper(new THREE.Vector3(1, -1, 0).normalize(), new THREE.Vector3(0, 0, 0), 2.5, 0xf472b6, 0.2, 0.1)
      host.scene.add(plane, incident, oRay, eRay)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!incident || !oRay || !eRay) return
      const ti = (Number(snap.values.thetaI ?? 0) * Math.PI) / 180
      const to = (Number(snap.values.thetaO ?? 0) * Math.PI) / 180
      const te = (Number(snap.values.thetaE ?? 0) * Math.PI) / 180
      const L = 2.6
      incident.position.set(-L * Math.sin(ti), L * Math.cos(ti), 0)
      incident.setDirection(new THREE.Vector3(Math.sin(ti), -Math.cos(ti), 0).normalize())
      incident.setLength(L, 0.2, 0.1)
      oRay.position.set(0, 0, 0)
      oRay.setDirection(new THREE.Vector3(Math.sin(to), -Math.cos(to), 0).normalize())
      oRay.setLength(L, 0.2, 0.1)
      eRay.position.set(0, 0, 0)
      eRay.setDirection(new THREE.Vector3(Math.sin(te), -Math.cos(te), 0).normalize())
      eRay.setLength(L, 0.2, 0.1)
      host.render()
    },
    dispose3d() {
      plane = null
      incident = null
      oRay = null
      eRay = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
