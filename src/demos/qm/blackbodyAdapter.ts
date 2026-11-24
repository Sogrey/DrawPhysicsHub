import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawBlackbodyFrame } from './renderBlackbody2d'

export function createBlackbodyAdapter(): DemoAdapter {
  let curve: THREE.Line | null = null
  let peak: THREE.Line | null = null
  let labels: Object3D | null = null
  let lastKey = ''

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawBlackbodyFrame(host, snap)
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [1.5, 0.4, 0],
        yaw: 0.45,
        pitch: 0.3,
        distance: 9,
        distanceMin: 4,
        distanceMax: 20,
      })
      const axes = new THREE.Group()
      axes.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 4, 0xf87171, 0.15, 0.08))
      axes.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 2, 0xf87171, 0.15, 0.08))
      host.scene.add(axes)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (curve) {
        host.scene.remove(curve)
        curve.geometry.dispose()
        ;(curve.material as THREE.Material).dispose()
        curve = null
      }
      if (peak) {
        host.scene.remove(peak)
        peak.geometry.dispose()
        ;(peak.material as THREE.Material).dispose()
        peak = null
      }
      const curveL = snap.values.curveL
      const curveU = snap.values.curveU
      const reveal = Number(snap.values.reveal ?? 0)
      const uMax = Number(snap.values.uMax ?? 1)
      const T = Number(snap.values.T ?? 0)
      const lPeak = Number(snap.values.lPeak ?? 0)
      if (curveL instanceof Float32Array && curveU instanceof Float32Array && reveal > 2) {
        const pts: THREE.Vector3[] = []
        for (let i = 0; i < reveal; i++) {
          pts.push(new THREE.Vector3(curveL[i]!, (curveU[i]! / uMax) * 1.8, 0))
        }
        curve = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
        )
        host.scene.add(curve)
      }
      if (lPeak > 0) {
        peak = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(lPeak, 0, 0.02),
            new THREE.Vector3(lPeak, 1.9, 0.02),
          ]),
          new THREE.LineDashedMaterial({ color: 0xa78bfa, dashSize: 0.12, gapSize: 0.08 }),
        )
        peak.computeLineDistances()
        host.scene.add(peak)
      }

      const key = `${T.toFixed(0)}|${lPeak.toFixed(3)}`
      if (key !== lastKey) {
        if (labels) {
          host.scene.remove(labels)
          labels.traverse((c) => {
            const m = c as Mesh
            m.geometry?.dispose?.()
            ;(m.material as THREE.Material)?.dispose?.()
          })
        }
        labels = new THREE.Group()
        const tLab = createTextSprite(`T=${T.toFixed(0)} K`, { color: '#fbbf24', fontSize: 40 })
        tLab.position.set(2.6, 1.7, 0.15)
        labels.add(tLab)
        if (lPeak > 0) {
          const pLab = createTextSprite(`λ_max`, { color: '#a78bfa', fontSize: 34, scale: 1.1 })
          pLab.position.set(lPeak + 0.15, 2.05, 0.15)
          labels.add(pLab)
        }
        const xLab = createTextSprite('λ', { color: '#f87171', fontSize: 34, scale: 1.0 })
        xLab.position.set(3.7, -0.25, 0.1)
        labels.add(xLab)
        const yLab = createTextSprite('u(λ)', { color: '#f87171', fontSize: 34, scale: 1.0 })
        yLab.position.set(-0.35, 1.9, 0.1)
        labels.add(yLab)
        host.scene.add(labels)
        lastKey = key
      }
      host.render()
    },
    dispose3d() {
      curve = null
      peak = null
      labels = null
      lastKey = ''
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
