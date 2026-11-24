import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { centralForceWorldBounds, drawCentralForceFrame } from './renderCentralForce2d'

export function createCentralForceAdapter(): DemoAdapter {
  let sun: Mesh | null = null
  let planet: Mesh | null = null
  let trail: THREE.Line | null = null
  let acc: THREE.ArrowHelper | null = null
  let labels: THREE.Group | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawCentralForceFrame(host, snap, centralForceWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.55,
        pitch: 0.75,
        distance: 12,
        distanceMin: 5,
        distanceMax: 28,
      })
      sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.5 }),
      )
      planet = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x075985, emissiveIntensity: 0.3 }),
      )
      trail = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.7 }),
      )
      acc = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(), 1, 0xf472b6, 0.18, 0.1)
      labels = new THREE.Group()
      labels.add(createTextSprite('力心', { color: '#fbbf24', fontSize: 34 }))
      labels.children[0]!.position.set(0.4, 0.2, 0)
      host.scene.add(sun, planet, trail, acc, labels)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!planet || !trail || !acc) return
      const x = Number(snap.values.x ?? 0)
      const y = Number(snap.values.y ?? 0)
      const ax = Number(snap.values.ax ?? 0)
      const ay = Number(snap.values.ay ?? 0)
      planet.position.set(x, 0, y)
      const path = snap.trails?.path
      if (path?.length) {
        setTrailPositions(
          trail,
          path.map((p) => [p[0]!, 0.02, p[1]!]),
        )
      }
      const am = Math.hypot(ax, ay)
      acc.position.set(x, 0.05, y)
      if (am > 0.05) {
        acc.visible = true
        acc.setDirection(new THREE.Vector3(ax / am, 0, ay / am))
        acc.setLength(Math.min(1.5, 0.35 + am * 0.12), 0.16, 0.09)
      } else acc.visible = false
      host.render()
    },
    dispose3d() {
      sun = null
      planet = null
      trail = null
      acc = null
      labels = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
