import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
import { drawRlcFrame, rlcWorldBounds } from './renderRlc2d'

export function createRlcAdapter(): DemoAdapter {
  let line: THREE.Line | null = null
  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawRlcFrame(host, snap, rlcWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [2, 1, 0], yaw: 0.3, pitch: 0.4, distance: 10, distanceMin: 4, distanceMax: 20 })
      line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      host.scene.add(line)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!line) return
      const path = snap.trails?.path
      if (path?.length) {
        const xmax = path[path.length - 1]![0]! || 1
        const ymax = Math.max(...path.map((p) => p[1]!), 0.1)
        setTrailPositions(
          line,
          path.map((p) => [(p[0]! / xmax) * 4, (p[1]! / ymax) * 2, 0]),
        )
      }
      host.render()
    },
    dispose3d() {
      line = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
