import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawQmDoubleSlitFrame } from './renderDoubleSlit2d'

export function createQmDoubleSlitAdapter(): DemoAdapter {
  let screen: THREE.Line | null = null
  let waveArcs: THREE.Line[] = []
  let labels: Object3D | null = null
  let lastKey = ''

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawQmDoubleSlitFrame(host, snap)
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [1.5, 0, 0],
        yaw: 0.35,
        pitch: 0.25,
        distance: 10,
        distanceMin: 4,
        distanceMax: 22,
      })
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 4, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 }),
      )
      barrier.position.set(0, 0, 0)
      host.scene.add(barrier)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (screen) {
        host.scene.remove(screen)
        screen.geometry.dispose()
        ;(screen.material as THREE.Material).dispose()
        screen = null
      }
      for (const a of waveArcs) {
        host.scene.remove(a)
        a.geometry.dispose()
        ;(a.material as THREE.Material).dispose()
      }
      waveArcs = []

      const dens = snap.values.dens
      const ys = snap.values.ys
      const nSamp = Number(snap.values.nSamp ?? 0)
      const iMax = Number(snap.values.iMax ?? 1)
      const d = Number(snap.values.d ?? 0.6)
      const lam = Number(snap.values.lambda ?? 0.35)
      const reveal = Number(snap.values.reveal ?? 1)
      const t = Number(snap.time ?? 0)
      const period = Number(snap.values.period ?? 8)
      const phase = ((t / period) * lam * 5) % Math.max(0.05, lam)

      if (dens instanceof Float32Array && ys instanceof Float32Array && nSamp > 2) {
        const pts: THREE.Vector3[] = []
        for (let i = 0; i < nSamp; i++) {
          pts.push(new THREE.Vector3(3, ys[i]!, (dens[i]! / iMax) * reveal))
        }
        screen = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
        )
        host.scene.add(screen)
      }

      // circular wavefront arcs centered on each slit (x=0, y=±d/2)
      const half = d / 2
      const rMax = 2.8 * (0.3 + 0.7 * reveal)
      for (const cy of [half, -half]) {
        for (let k = 0; k < 5; k++) {
          const r = lam * 0.12 + k * lam + phase
          if (r > rMax || r < lam * 0.08) continue
          const pts: THREE.Vector3[] = []
          for (let i = 0; i <= 28; i++) {
            const a = -1.1 + (2.2 * i) / 28
            pts.push(new THREE.Vector3(r * Math.cos(a), cy + r * Math.sin(a), 0.04))
          }
          const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({
              color: cy > 0 ? 0x7dd3fc : 0xa78bfa,
              transparent: true,
              opacity: 0.55 * (1 - r / (rMax + 0.1)),
            }),
          )
          waveArcs.push(line)
          host.scene.add(line)
        }
      }

      const key = `${d.toFixed(2)}|${lam.toFixed(3)}`
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
        const sLab = createTextSprite('屏 |ψ|²', { color: '#38bdf8', fontSize: 36 })
        sLab.position.set(3.3, 1.6, 0.2)
        labels.add(sLab)
        const dLab = createTextSprite(`d=${d.toFixed(2)}`, { color: '#a78bfa', fontSize: 34, scale: 1.1 })
        dLab.position.set(0.35, 0, 0.2)
        labels.add(dLab)
        const lLab = createTextSprite(`λ=${lam.toFixed(2)} 辅助波`, { color: '#fbbf24', fontSize: 34, scale: 1.1 })
        lLab.position.set(-1.2, 1.5, 0.2)
        labels.add(lLab)
        host.scene.add(labels)
        lastKey = key
      }
      host.render()
    },
    dispose3d() {
      screen = null
      waveArcs = []
      labels = null
      lastKey = ''
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
