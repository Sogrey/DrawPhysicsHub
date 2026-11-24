import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { barrierWorldBounds, drawBarrierFrame } from './renderBarrier2d'

export function createBarrierAdapter(): DemoAdapter {
  let barrier: Mesh | null = null
  let energy: THREE.Line | null = null
  let psiLine: THREE.Line | null = null
  let labels: Object3D | null = null
  let lastKey = ''

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawBarrierFrame(host, snap, barrierWorldBounds())
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0.6, 0.8, 0],
        yaw: 0.55,
        pitch: 0.35,
        distance: 12,
        distanceMin: 5,
        distanceMax: 28,
      })
      barrier = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.45,
        }),
      )
      host.scene.add(barrier)
      const floor = new THREE.GridHelper(10, 10, 0x334155, 0x1e293b)
      floor.rotation.x = Math.PI / 2
      floor.position.z = -0.15
      host.scene.add(floor)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!barrier) return
      const a = Number(snap.values.a ?? 1)
      const V0 = Number(snap.values.V0 ?? 2)
      const E = Number(snap.values.E ?? 1)
      const T = Number(snap.values.T ?? 0)
      barrier.scale.set(a, V0, 1)
      barrier.position.set(a / 2, V0 / 2, 0)
      const key = `${a}|${V0}|${E.toFixed(2)}`
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
        const eLab = createTextSprite(`E=${E.toFixed(2)}`, { color: '#fbbf24', fontSize: 38 })
        eLab.position.set(-2.2, E + 0.25, 0.15)
        labels.add(eLab)
        const aLab = createTextSprite(`a=${a.toFixed(1)}`, { color: '#a78bfa', fontSize: 36, scale: 1.2 })
        aLab.position.set(a / 2, V0 + 0.35, 0.15)
        labels.add(aLab)
        const tLab = createTextSprite(`T=${T.toFixed(3)}`, { color: '#4ade80', fontSize: 36, scale: 1.2 })
        tLab.position.set(a + 1.2, 0.4, 0.15)
        labels.add(tLab)
        const mode = createTextSprite(E < V0 ? '隧道' : '越过', { color: '#38bdf8', fontSize: 40 })
        mode.position.set(a / 2, -0.6, 0.15)
        labels.add(mode)
        host.scene.add(labels)
        lastKey = key
      }

      if (energy) {
        host.scene.remove(energy)
        energy.geometry.dispose()
        ;(energy.material as THREE.Material).dispose()
      }
      energy = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-4, E, 0),
          new THREE.Vector3(4, E, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
      )
      host.scene.add(energy)

      const psi = snap.values.psi
      const nSamp = Number(snap.values.nSamp ?? 0)
      const xMin = Number(snap.values.xMin ?? -4)
      const xMax = Number(snap.values.xMax ?? 4)
      if (psiLine) {
        host.scene.remove(psiLine)
        psiLine.geometry.dispose()
        ;(psiLine.material as THREE.Material).dispose()
      }
      if (psi instanceof Float32Array && nSamp > 2) {
        const pts: THREE.Vector3[] = []
        for (let i = 0; i < nSamp; i++) {
          const x = xMin + ((xMax - xMin) * i) / (nSamp - 1)
          pts.push(new THREE.Vector3(x, psi[i]! + 0.05, 0.05))
        }
        psiLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
        )
        host.scene.add(psiLine)
      }
      host.render()
    },

    dispose3d() {
      barrier = null
      energy = null
      psiLine = null
      labels = null
      lastKey = ''
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
