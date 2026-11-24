import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { complexF } from './complexSurf'
import { complexSurfWorldBounds, drawComplexSurfFrame } from './renderComplexSurf2d'

export function createComplexSurfAdapter(): DemoAdapter {
  let mesh: Mesh | null = null
  let probe: Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawComplexSurfFrame(host, snap, complexSurfWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.8, 0],
        yaw: 0.7,
        pitch: 0.55,
        distance: 9,
        distanceMin: 4,
        distanceMax: 18,
      })
      const geo = new THREE.PlaneGeometry(4, 4, 40, 40)
      mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.85,
        }),
      )
      mesh.rotation.x = -Math.PI / 2
      probe = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.4 }),
      )
      host.scene.add(mesh, probe)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!mesh || !probe) return
      const kind = Number(snap.values.kind ?? 1)
      const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const z = pos.getY(i) // plane local
        const f = complexF(x, z, kind)
        pos.setZ(i, Math.min(3.2, f.mod * 0.55))
      }
      pos.needsUpdate = true
      mesh.geometry.computeVertexNormals()
      const px = Number(snap.values.px ?? 0)
      const py = Number(snap.values.py ?? 0)
      const pf = complexF(px, py, kind)
      probe.position.set(px, Math.min(3.2, pf.mod * 0.55) + 0.12, py)
      host.render()
    },
    dispose3d() {
      mesh = null
      probe = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
