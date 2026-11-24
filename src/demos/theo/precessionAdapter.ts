import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawPrecessionFrame, precessionWorldBounds } from './renderPrecession2d'

export function createPrecessionAdapter(): DemoAdapter {
  let axis: THREE.ArrowHelper | null = null
  let tip: Mesh | null = null
  let disc: Mesh | null = null
  let ring: THREE.Line | null = null
  let labels: THREE.Group | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawPrecessionFrame(host, snap, precessionWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 1, 0],
        yaw: 0.7,
        pitch: 0.45,
        distance: 8,
        distanceMin: 3,
        distanceMax: 18,
      })
      axis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 2.2, 0xfbbf24, 0.2, 0.12)
      tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.4 }),
      )
      disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 0.12, 32),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.3, roughness: 0.5 }),
      )
      ring = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineDashedMaterial({ color: 0xa78bfa, dashSize: 0.12, gapSize: 0.08 }),
      )
      labels = new THREE.Group()
      labels.add(createTextSprite('自旋轴', { color: '#fbbf24', fontSize: 34 }))
      labels.children[0]!.position.set(0.4, 2.0, 0)
      host.scene.add(axis, tip, disc, ring, labels)
      host.scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 2.5, 0x38bdf8, 0.15, 0.08))
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!axis || !tip || !disc || !ring) return
      const ax = Number(snap.values.ax ?? 0)
      const ay = Number(snap.values.ay ?? 1)
      const az = Number(snap.values.az ?? 0)
      const len = Math.hypot(ax, ay, az) || 1
      const dir = new THREE.Vector3(ax / len, ay / len, az / len)
      axis.setDirection(dir)
      axis.setLength(len, 0.2, 0.12)
      tip.position.set(ax, ay, az)
      disc.position.set(ax * 0.45, ay * 0.45, az * 0.45)
      disc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
      const r = Math.hypot(ax, az)
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 48; i++) {
        const a = (2 * Math.PI * i) / 48
        pts.push(new THREE.Vector3(r * Math.cos(a), ay, r * Math.sin(a)))
      }
      ring.geometry.dispose()
      ring.geometry = new THREE.BufferGeometry().setFromPoints(pts)
      ring.computeLineDistances()
      host.render()
    },
    dispose3d() {
      axis = null
      tip = null
      disc = null
      ring = null
      labels = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
