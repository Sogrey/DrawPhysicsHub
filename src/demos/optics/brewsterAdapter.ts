import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { brewsterWorldBounds, drawBrewsterFrame } from './renderBrewster2d'

export function createBrewsterAdapter(): DemoAdapter {
  let plane: Mesh | null = null
  let incident: THREE.ArrowHelper | null = null
  let rs: THREE.ArrowHelper | null = null
  let rp: THREE.ArrowHelper | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawBrewsterFrame(host, snap, brewsterWorldBounds())
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
          opacity: 0.5,
          side: THREE.DoubleSide,
        }),
      )
      plane.rotation.x = -Math.PI / 2
      incident = new THREE.ArrowHelper(new THREE.Vector3(1, -1, 0).normalize(), new THREE.Vector3(-2, 2, 0), 2.8, 0x4ade80, 0.2, 0.1)
      rs = new THREE.ArrowHelper(new THREE.Vector3(1, 1, 0).normalize(), new THREE.Vector3(0, 0, 0), 2, 0x38bdf8, 0.2, 0.1)
      rp = new THREE.ArrowHelper(new THREE.Vector3(1, 1, 0).normalize(), new THREE.Vector3(0, 0, 0), 1.5, 0xf472b6, 0.2, 0.1)
      host.scene.add(plane, incident, rs, rp)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!incident || !rs || !rp) return
      const th = (Number(snap.values.theta ?? 0) * Math.PI) / 180
      const Rs = Number(snap.values.Rs ?? 0)
      const Rp = Number(snap.values.Rp ?? 0)
      const L = 2.6
      incident.position.set(-L * Math.sin(th), L * Math.cos(th), 0)
      incident.setDirection(new THREE.Vector3(Math.sin(th), -Math.cos(th), 0).normalize())
      incident.setLength(L, 0.2, 0.1)
      const rsLen = 0.5 + 2 * Rs
      const rpLen = 0.5 + 2 * Rp
      rs.position.set(0, 0, 0)
      rs.setDirection(new THREE.Vector3(Math.sin(th), Math.cos(th), 0).normalize())
      rs.setLength(rsLen, 0.18, 0.1)
      rp.position.set(0, 0, 0)
      rp.setDirection(new THREE.Vector3(Math.sin(th), Math.cos(th), 0).normalize())
      rp.setLength(Math.max(0.2, rpLen * 0.9), 0.16, 0.09)
      host.render()
    },
    dispose3d() {
      plane = null
      incident = null
      rs = null
      rp = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
