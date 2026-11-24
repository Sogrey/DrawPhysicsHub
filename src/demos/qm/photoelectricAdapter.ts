import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawPhotoelectricFrame } from './renderPhotoelectric2d'

const MAX_E = 24

export function createPhotoelectricAdapter(): DemoAdapter {
  let cathode: Mesh | null = null
  let anode: Mesh | null = null
  let electrons: Mesh[] = []
  let beam: THREE.Line | null = null
  let labels: Object3D | null = null
  let lastKey = ''

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawPhotoelectricFrame(host, snap)
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.4,
        pitch: 0.3,
        distance: 10,
        distanceMin: 4,
        distanceMax: 22,
      })
      cathode = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 2.2, 1),
        new THREE.MeshStandardMaterial({ color: 0x64748b }),
      )
      cathode.position.set(-1.5, 0, 0)
      anode = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 2.2, 1),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8 }),
      )
      anode.position.set(1.8, 0, 0)
      host.scene.add(cathode)
      host.scene.add(anode)
      electrons = []
      for (let i = 0; i < MAX_E; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            emissive: 0x92400e,
            emissiveIntensity: 0.4,
          }),
        )
        m.visible = false
        electrons.push(m)
        host.scene.add(m)
      }
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      const ex = snap.values.ex
      const ey = snap.values.ey
      const nElec = Number(snap.values.nElec ?? 0)
      const above = Number(snap.values.above ?? 0)
      const f = Number(snap.values.f ?? 0)
      const f0 = Number(snap.values.f0 ?? 0)
      const Kmax = Number(snap.values.Kmax ?? 0)
      for (let i = 0; i < MAX_E; i++) {
        const m = electrons[i]!
        if (ex instanceof Float32Array && ey instanceof Float32Array && i < nElec) {
          m.visible = true
          m.position.set(-1.2 + ex[i]!, ey[i]!, 0)
        } else m.visible = false
      }

      if (beam) {
        host.scene.remove(beam)
        beam.geometry.dispose()
        ;(beam.material as THREE.Material).dispose()
        beam = null
      }
      beam = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-4, 1.2, 0.2),
          new THREE.Vector3(-1.55, 0.2, 0.2),
        ]),
        new THREE.LineBasicMaterial({ color: above ? 0x38bdf8 : 0x475569 }),
      )
      host.scene.add(beam)

      const key = `${above}|${f.toFixed(2)}|${f0.toFixed(2)}|${Kmax.toFixed(2)}`
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
        const cLab = createTextSprite('阴极', { color: '#cbd5e1', fontSize: 34, scale: 1.1 })
        cLab.position.set(-1.5, -1.4, 0.2)
        labels.add(cLab)
        const aLab = createTextSprite('阳极', { color: '#cbd5e1', fontSize: 34, scale: 1.1 })
        aLab.position.set(1.8, -1.4, 0.2)
        labels.add(aLab)
        const mode = createTextSprite(above ? `hf=${f.toFixed(1)}>W 有电子` : `hf=${f.toFixed(1)}≤W 无电子`, {
          color: above ? '#4ade80' : '#f87171',
          fontSize: 34,
        })
        mode.position.set(-0.4, 1.7, 0.2)
        labels.add(mode)
        const eLab = createTextSprite(`Kmax=${Kmax.toFixed(2)}=hf−W`, { color: '#fbbf24', fontSize: 32, scale: 1.15 })
        eLab.position.set(0.1, 1.2, 0.2)
        labels.add(eLab)
        const cut = createTextSprite(`截止 f₀=${f0.toFixed(2)}`, { color: '#a78bfa', fontSize: 30, scale: 1.1 })
        cut.position.set(0.1, 0.75, 0.2)
        labels.add(cut)
        host.scene.add(labels)
        lastKey = key
      }
      host.render()
    },

    dispose3d() {
      cathode = null
      anode = null
      electrons = []
      beam = null
      labels = null
      lastKey = ''
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
