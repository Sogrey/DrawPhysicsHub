import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawLagrangeBeadFrame, lagrangeBeadWorldBounds } from './renderLagrangeBead2d'

export function createLagrangeBeadAdapter(): DemoAdapter {
  let rod: THREE.Line | null = null
  let bead: Mesh | null = null
  let trail: THREE.Line | null = null
  let axis: Mesh | null = null
  let labels: THREE.Group | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawLagrangeBeadFrame(host, snap, lagrangeBeadWorldBounds(Number(snap.values.world ?? 3.6)))
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.6,
        pitch: 0.7,
        distance: 10,
        distanceMin: 4,
        distanceMax: 22,
      })
      axis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x64748b }),
      )
      axis.position.y = 0.6
      rod = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
      )
      bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x075985, emissiveIntensity: 0.35 }),
      )
      trail = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.7 }),
      )
      labels = new THREE.Group()
      labels.add(createTextSprite('r', { color: '#fbbf24', fontSize: 34 }))
      host.scene.add(axis, rod, bead, trail, labels)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!rod || !bead || !trail) return
      const x = Number(snap.values.x ?? 0)
      const y = Number(snap.values.y ?? 0)
      const r = Number(snap.values.r ?? 0.5)
      const phi = (Number(snap.values.phiDeg ?? 0) * Math.PI) / 180
      const rodLen = 3.1
      rod.geometry.dispose()
      rod.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.05, 0),
        new THREE.Vector3(rodLen * Math.cos(phi), 0.05, rodLen * Math.sin(phi)),
      ])
      bead.position.set(x, 0.12, y)
      const path = snap.trails?.path
      if (path?.length) {
        setTrailPositions(
          trail,
          path.map((p) => [p[0]!, 0.02, p[1]!]),
        )
      }
      if (labels?.children[0]) {
        labels.children[0]!.position.set(0.5 * r * Math.cos(phi), 0.35, 0.5 * r * Math.sin(phi))
      }
      host.render()
    },
    dispose3d() {
      rod = null
      bead = null
      trail = null
      axis = null
      labels = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
