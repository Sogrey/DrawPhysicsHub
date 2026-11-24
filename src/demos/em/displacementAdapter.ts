import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { displacementWorldBounds, drawDisplacementFrame } from './renderDisplacement2d'

export function createDisplacementAdapter(): DemoAdapter {
  let top: Mesh | null = null
  let bot: Mesh | null = null
  let idArrow: THREE.ArrowHelper | null = null
  let eGroup: THREE.Group | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawDisplacementFrame(host, snap, displacementWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.6,
        pitch: 0.55,
        distance: 9,
        distanceMin: 4,
        distanceMax: 18,
      })
      const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4, roughness: 0.5 })
      top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 2.4), mat)
      bot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 2.4), mat.clone())
      top.position.y = 0.45
      bot.position.y = -0.45
      idArrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0.3, 0), 0.6, 0xa78bfa, 0.15, 0.08)
      eGroup = new THREE.Group()
      host.scene.add(top, bot, idArrow, eGroup)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!idArrow || !eGroup) return
      const Id = Number(snap.values.Id ?? 0)
      const E = Number(snap.values.E ?? 0)
      idArrow.setLength(Math.min(0.9, 0.25 + Id * 1.1), 0.14, 0.08)
      while (eGroup.children.length) eGroup.remove(eGroup.children[0]!)
      const n = Math.max(0, Math.min(6, Math.round(E * 3)))
      for (let i = 0; i < n; i++) {
        const x = -0.9 + (1.8 * i) / Math.max(1, n - 1)
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, 0.38, 0),
            new THREE.Vector3(x, -0.38, 0),
          ]),
          new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
        )
        eGroup.add(line)
      }
      host.render()
    },
    dispose3d() {
      top = null
      bot = null
      idArrow = null
      eGroup = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
