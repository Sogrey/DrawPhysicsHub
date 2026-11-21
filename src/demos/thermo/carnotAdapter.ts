import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { carnotWorldBounds, drawCarnotFrame } from './renderCarnot2d'

const VIS = 0.9

export function createCarnotAdapter(): DemoAdapter {
  let loopLine: THREE.Line | null = null
  let area: Mesh | null = null
  let marker: Mesh | null = null
  let axes: Object3D | null = null
  let lastKey = ''

  function rebuildLoop(host: ThreeHost, snap: ObserveSnapshot) {
    if (loopLine) {
      host.scene.remove(loopLine)
      loopLine.geometry.dispose()
      ;(loopLine.material as THREE.Material).dispose()
    }
    if (area) {
      host.scene.remove(area)
      area.geometry.dispose()
      ;(area.material as THREE.Material).dispose()
    }
    const Vs = snap.values.Vs
    const Ps = snap.values.Ps
    const n = Number(snap.values.nLoop ?? 0)
    if (!(Vs instanceof Float32Array) || !(Ps instanceof Float32Array) || n < 4) return

    const pts: THREE.Vector3[] = []
    for (let i = 0; i < n; i++) {
      pts.push(new THREE.Vector3(Vs[i]! * VIS, Ps[i]! * VIS, 0))
    }
    loopLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
    )
    host.scene.add(loopLine)

    const shape = new THREE.Shape()
    shape.moveTo(Vs[0]! * VIS, Ps[0]! * VIS)
    for (let i = 1; i < n; i++) shape.lineTo(Vs[i]! * VIS, Ps[i]! * VIS)
    shape.closePath()
    area = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      }),
    )
    area.position.z = -0.02
    host.scene.add(area)
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawCarnotFrame(host, snap, carnotWorldBounds())
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [2.5, 1.5, 0],
        yaw: 0.45,
        pitch: 0.4,
        distance: 12,
        distanceMin: 5,
        distanceMax: 28,
      })

      axes = new THREE.Group()
      axes.add(
        new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 5, 0xf87171, 0.2, 0.1),
      )
      axes.add(
        new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 4, 0xf87171, 0.2, 0.1),
      )
      // 辅助网格平面
      const grid = new THREE.GridHelper(8, 8, 0x334155, 0x1e293b)
      grid.rotation.x = Math.PI / 2
      grid.position.set(2.5, 1.5, -0.05)
      axes.add(grid)

      marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 14, 14),
        new THREE.MeshStandardMaterial({
          color: 0xf472b6,
          emissive: 0x9d174d,
          emissiveIntensity: 0.4,
        }),
      )

      host.scene.add(axes)
      host.scene.add(marker)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!marker) return
      const key = `${snap.values.Th}|${snap.values.Tc}|${snap.values.V1}|${snap.values.r}|${snap.values.gamma}`
      if (key !== lastKey) {
        rebuildLoop(host, snap)
        lastKey = key
      }
      marker.position.set(Number(snap.values.V ?? 1) * VIS, Number(snap.values.P ?? 1) * VIS, 0.1)
      host.render()
    },

    dispose3d() {
      loopLine = null
      area = null
      marker = null
      axes = null
      lastKey = ''
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
