import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawMalusFrame, malusWorldBounds } from './renderMalus2d'

const VIS = 1.2

function makeDisk(color: number): Mesh {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.12, 48),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.2,
      roughness: 0.55,
      transparent: true,
      opacity: 0.85,
    }),
  )
}

function makeAxisArrow(color: number): THREE.ArrowHelper {
  return new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -0.85, 0.08),
    1.7,
    color,
    0.28,
    0.16,
  )
}

export function createMalusAdapter(): DemoAdapter {
  let polarizer: Object3D | null = null
  let analyzer: Object3D | null = null
  let beam1: Mesh | null = null
  let beam2: Mesh | null = null
  let pAxis: THREE.ArrowHelper | null = null
  let aAxis: THREE.ArrowHelper | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 5)
      drawMalusFrame(host, snap, malusWorldBounds(world))
    },

    setup3d(host: ThreeHost) {
      // 默认＝光路侧视，便于看起偏→检偏；可用 HUD 预设切换
      host.setViewDefaults({
        lookAt: [2.5, 0, 0],
        yaw: 0.15,
        pitch: 0.22,
        distance: 11,
        distanceMin: 5,
        distanceMax: 28,
      })
      polarizer = new THREE.Group()
      const pDisk = makeDisk(0x64748b)
      pDisk.rotation.z = Math.PI / 2
      pAxis = makeAxisArrow(0xfbbf24)
      polarizer.add(pDisk)
      polarizer.add(pAxis)
      polarizer.position.set(1.5 * VIS, 0, 0)

      analyzer = new THREE.Group()
      const aDisk = makeDisk(0x38bdf8)
      aDisk.rotation.z = Math.PI / 2
      aAxis = makeAxisArrow(0xf472b6)
      analyzer.add(aDisk)
      analyzer.add(aAxis)
      analyzer.position.set(3.5 * VIS, 0, 0)

      beam1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 1.6, 16),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.7,
        }),
      )
      beam1.rotation.z = Math.PI / 2
      beam1.position.set(2.5 * VIS, 0, 0)

      beam2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 1.4, 16),
        new THREE.MeshStandardMaterial({
          color: 0x22d3ee,
          emissive: 0x0891b2,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.75,
        }),
      )
      beam2.rotation.z = Math.PI / 2
      beam2.position.set(4.4 * VIS, 0, 0)

      host.scene.add(polarizer)
      host.scene.add(analyzer)
      host.scene.add(beam1)
      host.scene.add(beam2)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!polarizer || !analyzer || !beam1 || !beam2) return
      const thetaP = Number(snap.values.thetaP ?? 0)
      const thetaA = Number(snap.values.thetaA ?? 0)
      const I1 = Number(snap.values.I1 ?? 0.5)
      const I2 = Number(snap.values.I2 ?? 0)
      const I0 = Number(snap.values.I0 ?? 1)

      polarizer.rotation.x = (thetaP * Math.PI) / 180
      analyzer.rotation.x = (thetaA * Math.PI) / 180

      const s1 = 0.35 + 0.65 * (I1 / Math.max(I0, 1e-6))
      const s2 = 0.15 + 0.85 * (I2 / Math.max(I1, 1e-6))
      beam1.scale.set(s1, 1, s1)
      beam2.scale.set(Math.max(0.08, s2), 1, Math.max(0.08, s2))
      ;(beam2.material as THREE.MeshStandardMaterial).opacity = 0.25 + 0.7 * (I2 / Math.max(I1, 1e-6))
      ;(beam2.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + 0.8 * (I2 / Math.max(I1, 1e-6))

      host.render()
    },

    dispose3d() {
      polarizer = null
      analyzer = null
      beam1 = null
      beam2 = null
      pAxis = null
      aAxis = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
