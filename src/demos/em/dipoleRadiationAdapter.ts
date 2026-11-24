import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { dipoleRadiationWorldBounds, drawDipoleRadiationFrame } from './renderDipoleRadiation2d'

export function createDipoleRadiationAdapter(): DemoAdapter {
  let plus: Mesh | null = null
  let minus: Mesh | null = null
  let rod: THREE.Line | null = null
  let lobe: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawDipoleRadiationFrame(host, snap, dipoleRadiationWorldBounds(Number(snap.values.world ?? 3.5)))
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.7,
        pitch: 0.55,
        distance: 10,
        distanceMin: 4,
        distanceMax: 22,
      })
      plus = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf87171, emissive: 0x7f1d1d, emissiveIntensity: 0.35 }),
      )
      minus = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x1e3a8a, emissiveIntensity: 0.35 }),
      )
      rod = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
      )
      lobe = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xa78bfa }),
      )
      host.scene.add(plus, minus, rod, lobe)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!plus || !minus || !rod || !lobe) return
      const p = Number(snap.values.p ?? 0)
      const half = 0.35 + 0.55 * Math.abs(p)
      plus.position.set(0, half, 0)
      minus.position.set(0, -half, 0)
      rod.geometry.dispose()
      rod.geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -half, 0),
        new THREE.Vector3(0, half, 0),
      ])
      const path = snap.trails?.path
      if (path?.length) {
        setTrailPositions(
          lobe,
          path.map((pt) => [pt[0]!, 0.02, pt[1]!]),
        )
      }
      host.render()
    },
    dispose3d() {
      plus = null
      minus = null
      rod = null
      lobe = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
