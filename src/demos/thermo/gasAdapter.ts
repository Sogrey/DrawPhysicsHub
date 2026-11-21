import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawGasFrame, gasWorldBounds } from './renderGas2d'

const VIS = 1
const MAX_MESH = 80

export function createGasAdapter(): DemoAdapter {
  let box: Object3D | null = null
  let wall: Mesh | null = null
  let dots: Mesh[] = []
  let hitMark: Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 5)
      drawGasFrame(host, snap, gasWorldBounds(world))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.55,
        pitch: 0.55,
        distance: 14,
        distanceMin: 6,
        distanceMax: 30,
      })

      box = new THREE.Group()
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
      const makeEdge = (a: THREE.Vector3, b: THREE.Vector3) => {
        const g = new THREE.BufferGeometry().setFromPoints([a, b])
        return new THREE.Line(g, edgeMat)
      }
      // unit box edges scaled in paint
      const corners = [
        [-1, -1, 0],
        [1, -1, 0],
        [1, 1, 0],
        [-1, 1, 0],
      ] as const
      for (let i = 0; i < 4; i++) {
        const a = corners[i]!
        const b = corners[(i + 1) % 4]!
        box.add(
          makeEdge(new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(b[0], b[1], b[2])),
        )
      }

      wall = new THREE.Mesh(
        new THREE.PlaneGeometry(0.08, 2),
        new THREE.MeshStandardMaterial({
          color: 0xf472b6,
          emissive: 0x9d174d,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.85,
        }),
      )

      dots = []
      for (let i = 0; i < MAX_MESH; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 8, 8),
          new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            emissive: 0x92400e,
            emissiveIntensity: 0.25,
          }),
        )
        m.visible = false
        dots.push(m)
        host.scene.add(m)
      }

      hitMark = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.5 }),
      )
      hitMark.visible = false

      host.scene.add(box)
      host.scene.add(wall)
      host.scene.add(hitMark)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!box || !wall || !hitMark) return
      const boxW = Number(snap.values.boxW ?? 6) * VIS
      const boxH = Number(snap.values.boxH ?? 4) * VIS
      const N = Math.min(MAX_MESH, Number(snap.values.N ?? 40))
      const xs = snap.values.xs
      const ys = snap.values.ys
      const hitFlash = Number(snap.values.hitFlash ?? 0)

      box.scale.set(boxW / 2, boxH / 2, 1)
      wall.position.set(boxW / 2, 0, 0.05)
      wall.scale.set(1, boxH / 2, 1)

      if (xs instanceof Float32Array && ys instanceof Float32Array) {
        for (let i = 0; i < MAX_MESH; i++) {
          const m = dots[i]!
          if (i < N) {
            m.visible = true
            m.position.set(xs[i]! * VIS, ys[i]! * VIS, 0)
          } else {
            m.visible = false
          }
        }
      }

      if (hitFlash > 0.05) {
        hitMark.visible = true
        hitMark.position.set(
          Number(snap.values.lastHitX ?? 0) * VIS,
          Number(snap.values.lastHitY ?? 0) * VIS,
          0.1,
        )
        const mat = hitMark.material as THREE.MeshBasicMaterial
        mat.opacity = 0.2 + 0.55 * hitFlash
        hitMark.scale.setScalar(0.8 + hitFlash)
      } else {
        hitMark.visible = false
      }

      host.render()
    },

    dispose3d() {
      box = null
      wall = null
      dots = []
      hitMark = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
