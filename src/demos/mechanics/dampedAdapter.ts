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

const VIS = 10

/** 无阻尼参考轨迹（同 A₀、ω₀、φ），便于对比衰减 */
export function buildDampedCompare(snap: ObserveSnapshot, _params?: ParamValues): CompareTrail {
  const A0 = Number(snap.values.A0 ?? 1)
  const omega0 = Number(snap.values.omega0 ?? 2)
  const phi = (Number(snap.values.phi ?? 0) * Math.PI) / 180
  const T = Number(snap.values.tMax ?? 8)
  const path: number[][] = []
  const n = 96
  for (let i = 0; i <= n; i++) {
    const t = (T * i) / n
    path.push([A0 * Math.cos(omega0 * t + phi), 0])
  }
  return { path, label: '无阻尼' }
}

export function createDampedAdapter(): DemoAdapter {
  let ball: Mesh | null = null
  let trailLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const A0 = Number(ctx.params.A0 ?? snap.values.A0 ?? 1)
      drawHarmonicFrame(host, snap, harmonicWorldBounds(A0), {
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
        color: 0xa78bfa,
        emissive: 0x4c1d95,
      })
      trailLine = createTrailLine(0xc4b5fd)
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

    buildCompare: buildDampedCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
