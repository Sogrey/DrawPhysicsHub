import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawOscillatorFrame, oscillatorWorldBounds } from './renderOscillator2d'

export function createOscillatorAdapter(): DemoAdapter {
  let psiLine: THREE.Line | null = null
  let potLine: THREE.Line | null = null
  let labels: Object3D | null = null
  let lastKey = ''

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawOscillatorFrame(host, snap, oscillatorWorldBounds(Number(snap.values.span ?? 4)))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.6, 0],
        yaw: 0.5,
        pitch: 0.35,
        distance: 11,
        distanceMin: 4,
        distanceMax: 26,
      })
      const grid = new THREE.GridHelper(10, 10, 0x334155, 0x1e293b)
      grid.rotation.x = Math.PI / 2
      grid.position.z = -0.1
      host.scene.add(grid)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      const clear = (line: THREE.Line | null) => {
        if (!line) return
        host.scene.remove(line)
        line.geometry.dispose()
        ;(line.material as THREE.Material).dispose()
      }
      clear(psiLine)
      clear(potLine)
      psiLine = null
      potLine = null

      const nSamp = Number(snap.values.nSamp ?? 0)
      const span = Number(snap.values.span ?? 4)
      const n = Number(snap.values.n ?? 0)
      const E = Number(snap.values.E ?? 0)
      const re = snap.values.re
      const pot = snap.values.pot
      if (pot instanceof Float32Array && nSamp > 2) {
        const pts: THREE.Vector3[] = []
        for (let i = 0; i < nSamp; i++) {
          const x = -span + (2 * span * i) / (nSamp - 1)
          pts.push(new THREE.Vector3(x, Math.min(3, pot[i]!), 0))
        }
        potLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x94a3b8 }),
        )
        host.scene.add(potLine)
      }
      if (re instanceof Float32Array && nSamp > 2) {
        const pts: THREE.Vector3[] = []
        for (let i = 0; i < nSamp; i++) {
          const x = -span + (2 * span * i) / (nSamp - 1)
          pts.push(new THREE.Vector3(x, re[i]! * 1.5, 0.05))
        }
        psiLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
        )
        host.scene.add(psiLine)
      }

      const key = `${n}|${E.toFixed(3)}|${span}`
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
        const nLab = createTextSprite(`n=${n}`, { color: '#38bdf8', fontSize: 40 })
        nLab.position.set(-span + 0.4, 2.4, 0.15)
        labels.add(nLab)
        const eLab = createTextSprite(`Eₙ=${E.toFixed(2)}`, { color: '#fbbf24', fontSize: 36, scale: 1.2 })
        eLab.position.set(span - 1.2, 2.2, 0.15)
        labels.add(eLab)
        const vLab = createTextSprite('V(x)', { color: '#94a3b8', fontSize: 34, scale: 1.1 })
        vLab.position.set(span * 0.55, 1.6, 0.1)
        labels.add(vLab)
        const pLab = createTextSprite('Re ψ', { color: '#fbbf24', fontSize: 34, scale: 1.1 })
        pLab.position.set(-0.4, -1.1, 0.1)
        labels.add(pLab)
        host.scene.add(labels)
        lastKey = key
      }
      host.render()
    },

    dispose3d() {
      psiLine = null
      potLine = null
      labels = null
      lastKey = ''
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
