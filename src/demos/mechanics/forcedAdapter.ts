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
import { drawForcedFrame, forcedWorldBounds } from './renderForced2d'

const VIS = 10

/** 同幅固有振动：A cos(ω₀ t)，便于对比驱动频率与固有频率 */
export function buildForcedCompare(snap: ObserveSnapshot, _params?: ParamValues): CompareTrail {
  const A = Number(snap.values.Ass ?? snap.values.A ?? 1)
  const omega0 = Number(snap.values.omega0 ?? 3)
  const T = Number(snap.values.tMax ?? 8)
  const path: number[][] = []
  const n = 96
  for (let i = 0; i <= n; i++) {
    const t = (T * i) / n
    path.push([A * Math.cos(omega0 * t), 0])
  }
  return { path, label: '同幅·固有' }
}

export function createForcedAdapter(): DemoAdapter {
  let ball: Mesh | null = null
  let trailLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const Ass = Number(ctx.params.Ass ?? snap.values.Ass ?? snap.values.A ?? 1)
      drawForcedFrame(host, snap, forcedWorldBounds(Ass), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.8, 0],
        yaw: 0.55,
        pitch: 0.38,
        distance: 22,
        distanceMin: 6,
        distanceMax: 60,
      })
      ball = createParticleMesh({
        radius: 0.85,
        color: 0xfbbf24,
        emissive: 0x78350f,
      })
      trailLine = createTrailLine(0xfde68a)
      host.scene.add(ball)
      host.scene.add(trailLine)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!ball || !trailLine) return
      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      ball.position.set(x, 0, 0)
      setTrailPositions(
        trailLine,
        (snap.trails?.path ?? []).map((p) => [p[0]! * VIS, 0, 0]),
      )
      host.render()
    },

    dispose3d() {
      ball = null
      trailLine = null
    },

    buildCompare: buildForcedCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
