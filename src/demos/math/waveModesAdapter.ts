import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
import { drawWaveModesFrame, waveModesWorldBounds } from './renderWaveModes2d'

export function createWaveModesAdapter(): DemoAdapter {
  let string: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawWaveModesFrame(host, snap, waveModesWorldBounds(Number(snap.values.L ?? 6)))
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [3, 0, 0],
        yaw: 0.35,
        pitch: 0.45,
        distance: 10,
        distanceMin: 4,
        distanceMax: 20,
      })
      string = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
      )
      host.scene.add(string)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!string) return
      const path = snap.trails?.path
      if (path?.length) setTrailPositions(string, path.map((p) => [p[0]!, p[1]!, 0]))
      host.render()
    },
    dispose3d() {
      string = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
