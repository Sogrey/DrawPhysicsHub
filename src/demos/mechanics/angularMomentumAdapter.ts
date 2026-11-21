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
import {
  angularMomentumWorldBounds,
  drawAngularMomentumFrame,
} from './renderAngularMomentum2d'

const VIS = 1.35

export function buildAngularMomentumCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const b = Number(snap.values.b ?? 1.5)
  const xSpan = Number(snap.values.xSpan ?? 5)
  return {
    path: [
      [-xSpan - 0.5, b],
      [xSpan + 0.5, b],
    ],
    label: `y=b=${b}`,
  }
}

export function createAngularMomentumAdapter(): DemoAdapter {
  let ball: Mesh | null = null
  let trailLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const b = Number(ctx.params.b ?? snap.values.b ?? 1.5)
      const xSpan = Number(snap.values.xSpan ?? 5)
      drawAngularMomentumFrame(host, snap, angularMomentumWorldBounds(b, xSpan), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 1, 0],
        yaw: 0.5,
        pitch: 0.55,
        distance: 18,
        distanceMin: 6,
        distanceMax: 40,
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

    buildCompare: buildAngularMomentumCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
