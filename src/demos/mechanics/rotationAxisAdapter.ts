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
import { drawRotationAxisFrame, rotationAxisWorldBounds } from './renderRotationAxis2d'

const VIS = 3.5

export function buildRotationAxisCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const R = Number(snap.values.R ?? 1.5)
  const path: number[][] = []
  const n = 72
  for (let i = 0; i <= n; i++) {
    const th = (2 * Math.PI * i) / n
    path.push([R * Math.cos(th), R * Math.sin(th)])
  }
  return { path, label: `R=${R}` }
}

export function createRotationAxisAdapter(): DemoAdapter {
  let rim: Mesh | null = null
  let trailLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const R = Number(ctx.params.R ?? snap.values.R ?? 1.5)
      drawRotationAxisFrame(host, snap, rotationAxisWorldBounds(R), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.3, 0],
        yaw: 0.7,
        pitch: 0.55,
        distance: 16,
        distanceMin: 5,
        distanceMax: 40,
      })
      rim = createParticleMesh({
        radius: 0.35,
        color: 0x22d3ee,
        emissive: 0x0e7490,
      })
      trailLine = createTrailLine(0x38bdf8)
      host.scene.add(rim)
      host.scene.add(trailLine)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!rim || !trailLine) return
      const x = (ctx.live.rimX ?? Number(snap.values.rimX ?? 0)) * VIS
      const y = (ctx.live.rimY ?? Number(snap.values.rimY ?? 0)) * VIS
      rim.position.set(x, y, 0)
      const path = (snap.trails?.path ?? []).map((p) => [p[0]! * VIS, p[1]! * VIS, 0])
      setTrailPositions(trailLine, path)
      host.render()
    },

    dispose3d() {
      rim = null
      trailLine = null
    },

    buildCompare: buildRotationAxisCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
