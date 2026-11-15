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
import { drawHarmonicFrame, harmonicWorldBounds } from './renderHarmonic2d'

/** 物理米 → 场景单位，避免振幅 ~1m 在抛体远距相机下看不见 */
const VIS = 10

export function buildHarmonicCompare(snap: ObserveSnapshot, _params?: ParamValues): CompareTrail {
  const A = Number(snap.values.A ?? 1)
  const omega = Number(snap.values.omega ?? 1)
  const phi = Number(snap.values.phi ?? 0)
  const T = Number(snap.values.tMax ?? (2 * Math.PI) / Math.max(1e-9, omega))
  const path: number[][] = []
  const n = 64
  for (let i = 0; i <= n; i++) {
    const t = (T * i) / n
    path.push([A * Math.cos(omega * t + phi), 0])
  }
  return { path, label: `A=${A}` }
}

export function createHarmonicAdapter(): DemoAdapter {
  let ball: Mesh | null = null
  let trailLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const A = Number(ctx.params.A ?? snap.values.A ?? 1)
      drawHarmonicFrame(host, snap, harmonicWorldBounds(A), {
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

    buildCompare: buildHarmonicCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
