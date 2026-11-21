import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawWaveplateFrame, waveplateWorldBounds } from './renderWaveplate2d'

const VIS = 1.15

function makeDisk(color: number): Mesh {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.14, 48),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.15,
      roughness: 0.55,
      transparent: true,
      opacity: 0.82,
    }),
  )
}

export function createWaveplateAdapter(): DemoAdapter {
  let plate: Object3D | null = null
  let tip: Mesh | null = null
  let trail: THREE.Line | null = null
  let eArrow: THREE.ArrowHelper | null = null
  const trailPts: THREE.Vector3[] = []
  let lastKind = -1

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 6)
      drawWaveplateFrame(host, snap, waveplateWorldBounds(world))
    },

    setup3d(host: ThreeHost) {
      // 默认侧视光路；「迎面看椭圆」预设对准出射端矢端轨迹
      host.setViewDefaults({
        lookAt: [2.2, 0, 0],
        yaw: 0.12,
        pitch: 0.2,
        distance: 10,
        distanceMin: 4,
        distanceMax: 26,
      })

      plate = new THREE.Group()
      const disk = makeDisk(0xa78bfa)
      disk.rotation.z = Math.PI / 2
      const fast = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -0.9, 0.1),
        1.8,
        0xfbbf24,
        0.28,
        0.16,
      )
      const slow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -0.9),
        1.8,
        0xf472b6,
        0.28,
        0.16,
      )
      plate.add(disk)
      plate.add(fast)
      plate.add(slow)
      plate.position.set(1.6 * VIS, 0, 0)

      const geom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
      trail = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 }),
      )
      trail.position.set(3.6 * VIS, 0, 0)

      tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xa78bfa,
          emissive: 0x7c3aed,
          emissiveIntensity: 0.6,
        }),
      )
      tip.position.set(3.6 * VIS, 0, 0)

      eArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(3.6 * VIS, 0, 0),
        0.5,
        0xa78bfa,
        0.12,
        0.08,
      )

      host.scene.add(plate)
      host.scene.add(trail)
      host.scene.add(tip)
      host.scene.add(eArrow)
      trailPts.length = 0
      lastKind = -1
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!plate || !tip || !trail || !eArrow) return
      const beta = Number(snap.values.beta ?? 0)
      const Ex = Number(snap.values.Ex ?? 0)
      const Ey = Number(snap.values.Ey ?? 0)
      const kindCode = Number(snap.values.kindCode ?? 1)
      const t = Number(snap.time ?? 0)

      plate.rotation.x = (beta * Math.PI) / 180

      const scale = 1.1
      tip.position.set(3.6 * VIS, Ey * scale, Ex * scale)

      const dir = new THREE.Vector3(0, Ey, Ex)
      const len = Math.max(0.05, dir.length() * scale)
      if (dir.lengthSq() > 1e-8) {
        eArrow.setDirection(dir.normalize())
        eArrow.setLength(len, 0.12, 0.08)
      }
      eArrow.position.set(3.6 * VIS, 0, 0)

      if (kindCode !== lastKind || t < 1e-6) {
        trailPts.length = 0
        lastKind = kindCode
      }
      trailPts.push(new THREE.Vector3(0, Ey * scale, Ex * scale))
      if (trailPts.length > 180) trailPts.shift()
      trail.geometry.dispose()
      trail.geometry = new THREE.BufferGeometry().setFromPoints(
        trailPts.length >= 2 ? trailPts : [new THREE.Vector3(), new THREE.Vector3()],
      )

      host.render()
    },

    dispose3d() {
      plate = null
      tip = null
      trail = null
      eArrow = null
      trailPts.length = 0
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
