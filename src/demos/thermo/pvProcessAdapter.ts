import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawPvProcessFrame } from './renderPvProcess2d'

const VIS = 0.85

export function createPvProcessAdapter(): DemoAdapter {
  let pathLine: THREE.Line | null = null
  let marker: Mesh | null = null
  let lastKey = ''

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawPvProcessFrame(host, snap)
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [2.2, 1.4, 0],
        yaw: 0.4,
        pitch: 0.35,
        distance: 11,
        distanceMin: 5,
        distanceMax: 26,
      })
      const axes = new THREE.Group()
      axes.add(
        new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 5, 0xf87171, 0.2, 0.1),
      )
      axes.add(
        new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 4, 0xf87171, 0.2, 0.1),
      )
      host.scene.add(axes)
      marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xf472b6,
          emissive: 0x9d174d,
          emissiveIntensity: 0.4,
        }),
      )
      host.scene.add(marker)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!marker) return
      const key = `${snap.values.kindId}|${snap.values.V0}|${snap.values.P0}|${snap.values.V1}|${snap.values.gamma}`
      if (key !== lastKey) {
        if (pathLine) {
          host.scene.remove(pathLine)
          pathLine.geometry.dispose()
          ;(pathLine.material as THREE.Material).dispose()
        }
        const Vs = snap.values.Vs
        const Ps = snap.values.Ps
        const n = Number(snap.values.nPath ?? 0)
        if (Vs instanceof Float32Array && Ps instanceof Float32Array && n > 2) {
          const pts: THREE.Vector3[] = []
          for (let i = 0; i < n; i++) pts.push(new THREE.Vector3(Vs[i]! * VIS, Ps[i]! * VIS, 0))
          pathLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
          )
          host.scene.add(pathLine)
        }
        lastKey = key
      }
      marker.position.set(Number(snap.values.V ?? 1) * VIS, Number(snap.values.P ?? 1) * VIS, 0.08)
      host.render()
    },

    dispose3d() {
      pathLine = null
      marker = null
      lastKey = ''
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
