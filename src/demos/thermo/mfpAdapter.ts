import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawMfpFrame, mfpWorldBounds } from './renderMfp2d'

const MAX_MESH = 48

export function createMfpAdapter(): DemoAdapter {
  let box: Object3D | null = null
  let dots: Mesh[] = []
  let ring: THREE.Line | null = null
  let hitMark: Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawMfpFrame(host, snap, mfpWorldBounds(Number(snap.values.world ?? 5)))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.5,
        pitch: 0.55,
        distance: 14,
        distanceMin: 6,
        distanceMax: 28,
      })
      box = new THREE.Group()
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
      const corners = [
        [-1, -1, 0],
        [1, -1, 0],
        [1, 1, 0],
        [-1, 1, 0],
      ] as const
      for (let i = 0; i < 4; i++) {
        const a = corners[i]!
        const b = corners[(i + 1) % 4]!
        const g = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(a[0], a[1], 0),
          new THREE.Vector3(b[0], b[1], 0),
        ])
        box.add(new THREE.Line(g, edgeMat))
      }
      host.scene.add(box)

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

      const circle: THREE.Vector3[] = []
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2
        circle.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0))
      }
      ring = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(circle),
        new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.7 }),
      )
      host.scene.add(ring)

      hitMark = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.5 }),
      )
      hitMark.visible = false
      host.scene.add(hitMark)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!box || !ring || !hitMark) return
      const boxW = Number(snap.values.boxW ?? 7)
      const boxH = Number(snap.values.boxH ?? 5)
      const N = Math.min(MAX_MESH, Number(snap.values.N ?? 24))
      const xs = snap.values.xs
      const ys = snap.values.ys
      box.scale.set(boxW / 2, boxH / 2, 1)
      const lam = Number(snap.values.lambdaTh ?? 1)
      ring.scale.setScalar(Math.max(0.2, lam))

      if (xs instanceof Float32Array && ys instanceof Float32Array) {
        for (let i = 0; i < MAX_MESH; i++) {
          const m = dots[i]!
          if (i < N) {
            m.visible = true
            m.position.set(xs[i]!, ys[i]!, 0)
          } else m.visible = false
        }
      }
      const hitFlash = Number(snap.values.hitFlash ?? 0)
      if (hitFlash > 0.05) {
        hitMark.visible = true
        hitMark.position.set(Number(snap.values.lastHitX ?? 0), Number(snap.values.lastHitY ?? 0), 0.1)
        ;(hitMark.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.55 * hitFlash
      } else hitMark.visible = false
      host.render()
    },

    dispose3d() {
      box = null
      dots = []
      ring = null
      hitMark = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
