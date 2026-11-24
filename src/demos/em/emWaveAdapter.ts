import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
import { drawEmWaveFrame, emWaveWorldBounds } from './renderEmWave2d'

export function createEmWaveAdapter(): DemoAdapter {
  let eLine: THREE.Line | null = null
  let bLine: THREE.Line | null = null
  let prop: THREE.ArrowHelper | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawEmWaveFrame(host, snap, emWaveWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [6, 0, 0],
        yaw: 0.85,
        pitch: 0.45,
        distance: 14,
        distanceMin: 6,
        distanceMax: 28,
      })
      eLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
      )
      bLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xf472b6 }),
      )
      prop = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 3, 0xfbbf24, 0.25, 0.14)
      host.scene.add(eLine, bLine, prop)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!eLine || !bLine || !prop) return
      const ePath = snap.trails?.path
      const bPath = snap.trails?.pathB
      if (ePath?.length) {
        setTrailPositions(
          eLine,
          ePath.map((p) => [p[0]!, p[1]!, 0]),
        )
      }
      if (bPath?.length) {
        setTrailPositions(
          bLine,
          bPath.map((p) => [p[0]!, 0, p[1]!]),
        )
      }
      const z = Number(snap.values.lambda ?? 4)
      prop.position.set(z, 0, 0)
      host.render()
    },
    dispose3d() {
      eLine = null
      bLine = null
      prop = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
