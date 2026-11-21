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
import { drawEnergyCurveFrame, energyCurveWorldBounds } from './renderEnergyCurve2d'

const VIS = 2.2

export function buildEnergyCurveCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const E = Number(snap.values.E ?? 1)
  const A = Number(snap.values.A ?? 1.5)
  const pad = Math.max(0.4, A * 0.35)
  return {
    path: [
      [-A - pad, E],
      [A + pad, E],
    ],
    label: `E=${E.toFixed(2)}`,
  }
}

export function createEnergyCurveAdapter(): DemoAdapter {
  let ball: Mesh | null = null
  let trailLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const A = Number(ctx.params.A ?? snap.values.A ?? 1.5)
      const E = Number(snap.values.E ?? 1)
      drawEnergyCurveFrame(host, snap, energyCurveWorldBounds(A, E), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.8, 0],
        yaw: 0.55,
        pitch: 0.4,
        distance: 14,
        distanceMin: 5,
        distanceMax: 36,
      })
      ball = createParticleMesh({
        radius: 0.35,
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
      ball.position.set(x, 0, 0)
      const path = (snap.trails?.path ?? []).map((p) => [p[0]! * VIS, 0, 0])
      setTrailPositions(trailLine, path)
      host.render()
    },

    dispose3d() {
      ball = null
      trailLine = null
    },

    buildCompare: buildEnergyCurveCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
