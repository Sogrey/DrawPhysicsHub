import type {
  CompareTrail,
  DemoAdapter,
  DemoAdapterContext,
} from '@/core/physics/adapter'
import type { ObserveSnapshot, ParamValues } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import {
  createParticleMesh,
  createTrailLine,
  setTrailPositions,
} from '@/core/render/particle3d'
import type { Line, Mesh } from 'three'
import { collisionWorldBounds, drawCollisionFrame } from './renderCollision2d'

const VIS = 3

export function buildCollisionCompare(snap: ObserveSnapshot, _params?: ParamValues): CompareTrail {
  // 保留球 1 当前扫过轨迹作对比
  const path = (snap.trails?.path1 ?? []).map((p) => [p[0]!, 0])
  return { path, label: '球1对比' }
}

export function createCollisionAdapter(): DemoAdapter {
  let ball1: Mesh | null = null
  let ball2: Mesh | null = null
  let trail1: Line | null = null
  let trail2: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      drawCollisionFrame(host, snap, collisionWorldBounds(snap), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.6, 0],
        yaw: 0.45,
        pitch: 0.32,
        distance: 18,
        distanceMin: 6,
        distanceMax: 50,
      })
      ball1 = createParticleMesh({ radius: 0.55, color: 0x38bdf8, emissive: 0x0c4a6e })
      ball2 = createParticleMesh({ radius: 0.55, color: 0xf97316, emissive: 0x7c2d12 })
      trail1 = createTrailLine(0x38bdf8)
      trail2 = createTrailLine(0xf97316)
      host.scene.add(ball1)
      host.scene.add(ball2)
      host.scene.add(trail1)
      host.scene.add(trail2)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!ball1 || !ball2 || !trail1 || !trail2) return
      const x1 = (ctx.live.x1 ?? Number(snap.values.x1 ?? 0)) * VIS
      const x2 = (ctx.live.x2 ?? Number(snap.values.x2 ?? 0)) * VIS
      const r1 = Number(snap.values.r1 ?? 0.4) * VIS
      const r2 = Number(snap.values.r2 ?? 0.4) * VIS
      ball1.scale.setScalar(r1 / 0.55)
      ball2.scale.setScalar(r2 / 0.55)
      ball1.position.set(x1, r1, 0)
      ball2.position.set(x2, r2, 0)
      setTrailPositions(
        trail1,
        (snap.trails?.path1 ?? []).map((p) => [p[0]! * VIS, r1, 0]),
      )
      setTrailPositions(
        trail2,
        (snap.trails?.path2 ?? []).map((p) => [p[0]! * VIS, r2, 0]),
      )
      host.render()
    },

    dispose3d() {
      ball1 = null
      ball2 = null
      trail1 = null
      trail2 = null
    },

    buildCompare: buildCollisionCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
