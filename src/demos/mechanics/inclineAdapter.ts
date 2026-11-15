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
import { drawInclineFrame, inclineWorldBounds } from './renderIncline2d'

const VIS = 2.2

export function buildInclineCompare(snap: ObserveSnapshot, _params?: ParamValues): CompareTrail {
  // 无摩擦参考：沿斜面到底的直线轨迹
  const L = Number(snap.values.L ?? 4)
  const th = ((Number(snap.values.theta ?? 30) * Math.PI) / 180)
  const Hy = L * Math.sin(th)
  return {
    path: [
      [0, Hy],
      [L * Math.cos(th), 0],
    ],
    label: '斜面全长',
  }
}

export function createInclineAdapter(): DemoAdapter {
  let block: Mesh | null = null
  let trailLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const L = Number(ctx.params.L ?? snap.values.L ?? 4)
      const theta = Number(ctx.params.theta ?? snap.values.theta ?? 30)
      drawInclineFrame(host, snap, inclineWorldBounds(L, theta), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [4, 1.2, 0],
        yaw: 0.55,
        pitch: 0.4,
        distance: 16,
        distanceMin: 6,
        distanceMax: 40,
      })
      block = createParticleMesh({
        radius: 0.35,
        color: 0x38bdf8,
        emissive: 0x0c4a6e,
      })
      trailLine = createTrailLine(0x22d3ee)
      host.scene.add(block)
      host.scene.add(trailLine)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!block || !trailLine) return
      const L = Number(snap.values.L ?? 4)
      const th = ((Number(snap.values.theta ?? 30) * Math.PI) / 180)
      const s = ctx.live.s ?? Number(snap.values.s ?? 0)
      const Hy = L * Math.sin(th)
      const r = 0.35
      // 球心沿斜面法向抬起，使底部贴在斜面上
      const x = (s * Math.cos(th) - Math.sin(th) * r) * VIS
      const y = (Hy - s * Math.sin(th) + Math.cos(th) * r) * VIS
      block.position.set(x, y, 0)
      setTrailPositions(
        trailLine,
        (snap.trails?.path ?? []).map((p) => [p[0]! * VIS, p[1]! * VIS, 0]),
      )
      host.render()
    },

    dispose3d() {
      block = null
      trailLine = null
    },

    buildCompare: buildInclineCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
