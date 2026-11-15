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
import { circularWorldBounds, drawCircularFrame } from './renderCircular2d'

const VIS = 4

export function buildCircularCompare(snap: ObserveSnapshot, _params?: ParamValues): CompareTrail {
  const R = Number(snap.values.R ?? 1)
  const path: number[][] = []
  const n = 72
  for (let i = 0; i <= n; i++) {
    const th = (2 * Math.PI * i) / n
    path.push([R * Math.cos(th), R * Math.sin(th)])
  }
  return { path, label: `R=${R}` }
}

export function createCircularAdapter(): DemoAdapter {
  let ball: Mesh | null = null
  let trailLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const R = Number(ctx.params.R ?? snap.values.R ?? 1)
      drawCircularFrame(host, snap, circularWorldBounds(R), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.5, 0],
        yaw: 0.7,
        pitch: 0.55,
        distance: 16,
        distanceMin: 5,
        distanceMax: 45,
      })
      ball = createParticleMesh({
        radius: 0.45,
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

    buildCompare: buildCircularCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
