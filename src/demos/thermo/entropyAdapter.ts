import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawEntropyFrame, entropyWorldBounds } from './renderEntropy2d'

const MAX_P = 28

export function createEntropyAdapter(): DemoAdapter {
  let left: Mesh | null = null
  let right: Mesh | null = null
  let wall: Mesh | null = null
  let flow: THREE.ArrowHelper | null = null
  let particles: Mesh[] = []
  let labels: Object3D | null = null
  let lastPhase = -1

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawEntropyFrame(host, snap, entropyWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.55,
        pitch: 0.35,
        distance: 11,
        distanceMin: 4,
        distanceMax: 22,
      })
      left = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.2, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }),
      )
      left.position.x = -1.15
      right = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.2, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.1 }),
      )
      right.position.x = 1.15
      wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 2.2, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xf87171, transparent: true, opacity: 0.95 }),
      )
      flow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-0.2, 0, 0.3), 1.5, 0xa78bfa, 0.2, 0.12)
      host.scene.add(left)
      host.scene.add(right)
      host.scene.add(wall)
      host.scene.add(flow)
      particles = []
      for (let i = 0; i < MAX_P; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.35 }),
        )
        particles.push(m)
        host.scene.add(m)
      }
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!left || !right || !wall || !flow) return
      const mix = Number(snap.values.mix ?? 0)
      const phase = Number(snap.values.phase ?? 0)
      const dS = Number(snap.values.dS ?? 0)
      const dSFinal = Number(snap.values.dSFinal ?? 1)
      ;(left.material as THREE.MeshStandardMaterial).opacity = 0.4
      ;(right.material as THREE.MeshStandardMaterial).opacity = 0.06 + 0.4 * mix
      wall.visible = mix < 0.92
      ;(wall.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 1 - mix)
      flow.visible = mix > 0.08 && mix < 0.95
      flow.setLength(0.4 + 1.4 * mix, 0.18, 0.1)

      const px = snap.values.px
      const py = snap.values.py
      const nPart = Number(snap.values.nPart ?? 0)
      for (let i = 0; i < MAX_P; i++) {
        const m = particles[i]!
        if (px instanceof Float32Array && py instanceof Float32Array && i < nPart) {
          m.visible = true
          m.position.set(px[i]!, py[i]!, 0.15)
        } else m.visible = false
      }

      if (phase !== lastPhase) {
        if (labels) {
          host.scene.remove(labels)
          labels.traverse((c) => {
            const m = c as Mesh
            m.geometry?.dispose?.()
            ;(m.material as THREE.Material)?.dispose?.()
          })
        }
        labels = new THREE.Group()
        const a = createTextSprite(`ΔS=${dS.toFixed(2)}`, { color: '#a78bfa', fontSize: 40 })
        a.position.set(0, 1.5, 0.2)
        labels.add(a)
        const stage =
          phase === 0 ? '①隔板在' : phase === 1 ? '②膨胀中' : '③已混匀'
        const b = createTextSprite(stage, {
          color: phase === 2 ? '#4ade80' : '#f87171',
          fontSize: 36,
          scale: 1.3,
        })
        b.position.set(0, -1.55, 0.2)
        labels.add(b)
        const c = createTextSprite(`终态 ΔS=${dSFinal.toFixed(2)}`, { color: '#fbbf24', fontSize: 34, scale: 1.2 })
        c.position.set(1.6, 1.5, 0.2)
        labels.add(c)
        host.scene.add(labels)
        lastPhase = phase
      }
      host.render()
    },
    dispose3d() {
      left = null
      right = null
      wall = null
      flow = null
      particles = []
      labels = null
      lastPhase = -1
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
