import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawMaxwellFrame } from './renderMaxwell2d'

export function createMaxwellAdapter(): DemoAdapter {
  let curve: THREE.Line | null = null
  let marks: Mesh[] = []

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawMaxwellFrame(host, snap)
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [2, 0.4, 0],
        yaw: 0.5,
        pitch: 0.35,
        distance: 10,
        distanceMin: 4,
        distanceMax: 24,
      })
      const axes = new THREE.Group()
      axes.add(
        new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 5, 0xf87171, 0.2, 0.1),
      )
      axes.add(
        new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 2.5, 0xf87171, 0.2, 0.1),
      )
      host.scene.add(axes)

      marks = [0xf472b6, 0x38bdf8, 0x4ade80].map((c) => {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 10, 10),
          new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35 }),
        )
        host.scene.add(m)
        return m
      })
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      const curveV = snap.values.curveV
      const curveF = snap.values.curveF
      const nCurve = Number(snap.values.nCurve ?? 0)
      if (curveV instanceof Float32Array && curveF instanceof Float32Array && nCurve > 2) {
        if (curve) {
          host.scene.remove(curve)
          curve.geometry.dispose()
          ;(curve.material as THREE.Material).dispose()
        }
        const pts: THREE.Vector3[] = []
        for (let i = 0; i < nCurve; i++) {
          pts.push(new THREE.Vector3(curveV[i]!, curveF[i]! * 8, 0))
        }
        curve = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
        )
        host.scene.add(curve)
      }
      const vs = [
        Number(snap.values.vp ?? 0),
        Number(snap.values.vavg ?? 0),
        Number(snap.values.vrms ?? 0),
      ]
      const pdfT = Number(snap.values.T ?? 1)
      for (let i = 0; i < marks.length; i++) {
        const v = vs[i]!
        const y =
          4 *
          Math.PI *
          v *
          v *
          Math.pow(1 / Math.sqrt(2 * Math.PI * pdfT), 3) *
          Math.exp(-(v * v) / (2 * pdfT))
        marks[i]!.position.set(v, y * 8, 0.05)
      }
      host.render()
    },

    dispose3d() {
      curve = null
      marks = []
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
