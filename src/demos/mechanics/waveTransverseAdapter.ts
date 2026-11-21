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
import { drawWaveTransverseFrame, waveTransverseWorldBounds } from './renderWaveTransverse2d'

const VIS = 1.1

export function buildWaveTransverseCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const A = Number(snap.values.A ?? 1)
  const lambda = Number(snap.values.lambda ?? 4)
  const k = (2 * Math.PI) / Math.max(1e-9, lambda)
  const xMax = Number(snap.values.xMax ?? 12)
  const path: number[][] = []
  const n = 100
  for (let i = 0; i <= n; i++) {
    const x = (xMax * i) / n
    path.push([x, A * Math.cos(k * x)]) // t=0
  }
  return { path, label: 't=0' }
}

export function createWaveTransverseAdapter(): DemoAdapter {
  let bead0: Mesh | null = null
  let beadL: Mesh | null = null
  let waveLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const A = Number(ctx.params.A ?? snap.values.A ?? 1)
      const xMax = Number(snap.values.xMax ?? 12)
      drawWaveTransverseFrame(host, snap, waveTransverseWorldBounds(A, xMax), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [6, 0, 0],
        yaw: 0.35,
        pitch: 0.45,
        distance: 22,
        distanceMin: 8,
        distanceMax: 50,
      })
      bead0 = createParticleMesh({
        radius: 0.35,
        color: 0xfbbf24,
        emissive: 0x92400e,
      })
      beadL = createParticleMesh({
        radius: 0.35,
        color: 0xfbbf24,
        emissive: 0x92400e,
      })
      waveLine = createTrailLine(0x38bdf8)
      host.scene.add(bead0)
      host.scene.add(beadL)
      host.scene.add(waveLine)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!bead0 || !beadL || !waveLine) return
      const y0 = (ctx.live.y0 ?? Number(snap.values.y0 ?? 0)) * VIS
      const yP = (ctx.live.yProbe ?? Number(snap.values.yProbe ?? 0)) * VIS
      const xP = Number(snap.values.xProbe ?? 4) * VIS
      bead0.position.set(0, y0, 0)
      beadL.position.set(xP, yP, 0)
      const path = (snap.trails?.path ?? []).map((p) => [p[0]! * VIS, p[1]! * VIS, 0])
      setTrailPositions(waveLine, path)
      host.render()
    },

    dispose3d() {
      bead0 = null
      beadL = null
      waveLine = null
    },

    buildCompare: buildWaveTransverseCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
