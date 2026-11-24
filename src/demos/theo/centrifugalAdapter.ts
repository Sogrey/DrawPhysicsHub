import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { centrifugalWorldBounds, drawCentrifugalFrame } from './renderCentrifugal2d'

export function createCentrifugalAdapter(): DemoAdapter {
  let disk: Mesh | null = null
  let probe: Mesh | null = null
  let slot: THREE.Line | null = null
  let arrow: THREE.ArrowHelper | null = null
  let turntable: THREE.Group | null = null
  let labels: THREE.Group | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawCentrifugalFrame(host, snap, centrifugalWorldBounds(Number(snap.values.world ?? 4)))
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.55,
        pitch: 0.85,
        distance: 11,
        distanceMin: 4,
        distanceMax: 24,
      })
      turntable = new THREE.Group()
      disk = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.2, 0.08, 48),
        new THREE.MeshStandardMaterial({ color: 0x475569, transparent: true, opacity: 0.45 }),
      )
      disk.position.y = 0.04
      turntable.add(disk)
      slot = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0.1, 0),
          new THREE.Vector3(3.1, 0.1, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x94a3b8 }),
      )
      turntable.add(slot)
      probe = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.35 }),
      )
      arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xf472b6, 0.2, 0.12)
      labels = new THREE.Group()
      labels.add(createTextSprite('a_cf', { color: '#f472b6', fontSize: 34 }))
      host.scene.add(turntable, probe, arrow, labels)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!probe || !arrow || !turntable) return
      const r = Number(snap.values.r ?? 0.4)
      const Omega = Number(snap.values.Omega ?? 1)
      const t = Number(snap.time ?? 0)
      const acf = Number(snap.values.acf ?? 0)
      turntable.rotation.y = Omega * t
      // 槽沿转盘 +X；质点在槽上
      probe.position.set(Math.min(3.0, r), 0.22, 0)
      probe.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), Omega * t)
      const dir = new THREE.Vector3(Math.cos(Omega * t), 0, -Math.sin(Omega * t))
      arrow.position.copy(probe.position)
      arrow.setDirection(dir)
      arrow.setLength(Math.min(2, 0.4 + acf * 0.2), 0.18, 0.1)
      if (labels?.children[0]) {
        labels.children[0]!.position.copy(probe.position).add(dir.clone().multiplyScalar(1.2))
        labels.children[0]!.position.y += 0.3
      }
      host.render()
    },
    dispose3d() {
      disk = null
      probe = null
      slot = null
      arrow = null
      turntable = null
      labels = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
