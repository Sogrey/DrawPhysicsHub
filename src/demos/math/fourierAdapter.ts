import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
import { drawFourierFrame, fourierWorldBounds } from './renderFourier2d'

export function createFourierAdapter(): DemoAdapter {
  let wave: THREE.Line | null = null
  let target: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawFourierFrame(host, snap, fourierWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [3, 0, 0],
        yaw: 0.4,
        pitch: 0.55,
        distance: 10,
        distanceMin: 4,
        distanceMax: 20,
      })
      wave = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
      )
      target = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.12, gapSize: 0.08 }),
      )
      host.scene.add(wave, target)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!wave || !target) return
      const path = snap.trails?.path
      const tgt = snap.trails?.target
      if (path?.length) setTrailPositions(wave, path.map((p) => [p[0]!, p[1]!, 0]))
      if (tgt?.length) {
        setTrailPositions(target, tgt.map((p) => [p[0]!, p[1]!, 0]))
        target.computeLineDistances()
      }
      host.render()
    },
    dispose3d() {
      wave = null
      target = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
