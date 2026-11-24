import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import { setTrailPositions } from '@/core/render/particle3d'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { doublePendulumWorldBounds, drawDoublePendulumFrame } from './renderDoublePendulum2d'

export function createDoublePendulumAdapter(): DemoAdapter {
  let pivot: Mesh | null = null
  let bob1: Mesh | null = null
  let bob2: Mesh | null = null
  let rod1: THREE.Line | null = null
  let rod2: THREE.Line | null = null
  let trail: THREE.Line | null = null
  let labels: THREE.Group | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 3)
      drawDoublePendulumFrame(host, snap, doublePendulumWorldBounds(world))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, -1.2, 0],
        yaw: 0.4,
        pitch: 0.35,
        distance: 9,
        distanceMin: 4,
        distanceMax: 20,
      })
      pivot = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8 }),
      )
      bob1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.35 }),
      )
      bob2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x075985, emissiveIntensity: 0.35 }),
      )
      rod1 = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xcbd5e1 }),
      )
      rod2 = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xcbd5e1 }),
      )
      trail = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.7 }),
      )
      labels = new THREE.Group()
      const a = createTextSprite('m₁', { color: '#fbbf24', fontSize: 36 })
      const b = createTextSprite('m₂', { color: '#38bdf8', fontSize: 36 })
      a.position.set(0.3, 0, 0.2)
      b.position.set(0.3, 0, 0.2)
      labels.add(a, b)
      host.scene.add(pivot, bob1, bob2, rod1, rod2, trail, labels)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!bob1 || !bob2 || !rod1 || !rod2 || !trail) return
      const x1 = Number(snap.values.x1 ?? 0)
      const y1 = Number(snap.values.y1 ?? 0)
      const x2 = Number(snap.values.x2 ?? 0)
      const y2 = Number(snap.values.y2 ?? 0)
      bob1.position.set(x1, y1, 0)
      bob2.position.set(x2, y2, 0)
      rod1.geometry.dispose()
      rod1.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x1, y1, 0),
      ])
      rod2.geometry.dispose()
      rod2.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y1, 0),
        new THREE.Vector3(x2, y2, 0),
      ])
      const path = snap.trails?.path
      if (path?.length) {
        setTrailPositions(
          trail,
          path.map((p) => [p[0]!, p[1]!, 0]),
        )
      }
      if (labels) {
        labels.children[0]?.position.set(x1 + 0.25, y1 + 0.15, 0.15)
        labels.children[1]?.position.set(x2 + 0.25, y2 + 0.15, 0.15)
      }
      host.render()
    },

    dispose3d() {
      pivot = null
      bob1 = null
      bob2 = null
      rod1 = null
      rod2 = null
      trail = null
      labels = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
