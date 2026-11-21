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
import { drawNaturalFrameFrame, naturalFrameWorldBounds } from './renderNaturalFrame2d'

const VIS = 3.2

export function buildNaturalFrameCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const A = Number(snap.values.A ?? 3)
  const B = Number(snap.values.B ?? 1.8)
  const path: number[][] = []
  const n = 96
  for (let i = 0; i <= n; i++) {
    const th = (2 * Math.PI * i) / n
    path.push([A * Math.cos(th), B * Math.sin(th)])
  }
  return { path, label: `A=${A}, B=${B}` }
}

export function createNaturalFrameAdapter(): DemoAdapter {
  let ball: Mesh | null = null
  let trailLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const A = Number(ctx.params.A ?? snap.values.A ?? 3)
      const B = Number(ctx.params.B ?? snap.values.B ?? 1.8)
      drawNaturalFrameFrame(host, snap, naturalFrameWorldBounds(A, B), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.4, 0],
        yaw: 0.65,
        pitch: 0.5,
        distance: 18,
        distanceMin: 6,
        distanceMax: 48,
      })
      ball = createParticleMesh({
        radius: 0.4,
        color: 0x38bdf8,
        emissive: 0x0c4a6e,
      })
      trailLine = createTrailLine(0x22d3ee)
      host.scene.add(ball)
      host.scene.add(trailLine)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!ball || !trailLine) return
      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      const y = (ctx.live.y ?? Number(snap.values.y ?? 0)) * VIS
      ball.position.set(x, y, 0)
      const path = (snap.trails?.path ?? []).map((p) => [p[0]! * VIS, p[1]! * VIS, 0])
      setTrailPositions(trailLine, path)
      host.render()
    },

    dispose3d() {
      ball = null
      trailLine = null
    },

    buildCompare: buildNaturalFrameCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
