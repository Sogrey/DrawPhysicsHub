import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
import { beatsWorldBounds, drawBeatsFrame } from './renderBeats2d'

export function createBeatsAdapter(): DemoAdapter {
  let line: THREE.Line | null = null
  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawBeatsFrame(host, snap, beatsWorldBounds(Number(snap.values.period ?? 12)))
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [6, 0, 0],
        yaw: 0.3,
        pitch: 0.4,
        distance: 14,
        distanceMin: 5,
        distanceMax: 28,
      })
      line = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
      )
      host.scene.add(line)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!line) return
      const path = snap.trails?.path
      if (path?.length) setTrailPositions(line, path.map((p) => [p[0]!, p[1]!, 0]))
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
