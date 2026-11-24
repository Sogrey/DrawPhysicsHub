import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawFoucaultFrame, foucaultWorldBounds } from './renderFoucault2d'

export function createFoucaultAdapter(): DemoAdapter {
  let bob: Mesh | null = null
  let string: THREE.Line | null = null
  let trail: THREE.Line | null = null
  let plane: THREE.Line | null = null
  let labels: THREE.Group | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawFoucaultFrame(host, snap, foucaultWorldBounds(Number(snap.values.world ?? 3)))
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, -0.8, 0],
        yaw: 0.5,
        pitch: 0.55,
        distance: 8,
        distanceMin: 3,
        distanceMax: 18,
      })
      bob = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x075985, emissiveIntensity: 0.35 }),
      )
      string = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xcbd5e1 }),
      )
      trail = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.65 }),
      )
      plane = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineDashedMaterial({ color: 0xa78bfa, dashSize: 0.15, gapSize: 0.1 }),
      )
      labels = new THREE.Group()
      labels.add(createTextSprite('摆平面', { color: '#a78bfa', fontSize: 32 }))
      host.scene.add(bob, string, trail, plane, labels)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!bob || !string || !trail || !plane) return
      const x = Number(snap.values.x ?? 0)
      const y = Number(snap.values.y ?? 0)
      const z = Number(snap.values.z ?? -2)
      // map: floor XZ, up Y；物理 (x,y) 水平，z 向下 → Three (x, -z, y) wait z is already negative down
      // Use: X=x, Y=z (negative), Z=y
      bob.position.set(x, z, y)
      string.geometry.dispose()
      string.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, z, y),
      ])
      const alpha = (Number(snap.values.alphaDeg ?? 0) * Math.PI) / 180
      const L = Number(snap.values.L ?? 2)
      const plen = L * 0.55
      plane.geometry.dispose()
      plane.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-plen * Math.cos(alpha), -0.02, -plen * Math.sin(alpha)),
        new THREE.Vector3(plen * Math.cos(alpha), -0.02, plen * Math.sin(alpha)),
      ])
      plane.computeLineDistances()
      const path = snap.trails?.path
      if (path?.length) {
        setTrailPositions(
          trail,
          path.map((p) => [p[0]!, -0.01, p[1]!]),
        )
      }
      if (labels?.children[0]) {
        labels.children[0]!.position.set(plen * Math.cos(alpha) * 0.7, 0.2, plen * Math.sin(alpha) * 0.7)
      }
      host.render()
    },
    dispose3d() {
      bob = null
      string = null
      trail = null
      plane = null
      labels = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
