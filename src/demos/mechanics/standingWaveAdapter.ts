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
import { drawStandingWaveFrame, standingWaveWorldBounds } from './renderStandingWave2d'

const VIS = 1.15

export function buildStandingWaveCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const upper = snap.trails?.envelopeUpper
  if (upper?.length) {
    return { path: upper.map((p) => [...p]), label: '包络' }
  }
  const A = Number(snap.values.A ?? 0.6)
  const lambda = Number(snap.values.lambda ?? 4)
  const k = (2 * Math.PI) / Math.max(1e-9, lambda)
  const xMax = Number(snap.values.xMax ?? 1.5 * lambda)
  const path: number[][] = []
  const n = 100
  for (let i = 0; i <= n; i++) {
    const x = (xMax * i) / n
    path.push([x, 2 * A * Math.abs(Math.cos(k * x))])
  }
  return { path, label: '包络' }
}

export function createStandingWaveAdapter(): DemoAdapter {
  let anti: Mesh | null = null
  let node: Mesh | null = null
  let waveLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const ampMax = Number(snap.values.ampMax ?? 1.2)
      const xMax = Number(snap.values.xMax ?? 6)
      drawStandingWaveFrame(host, snap, standingWaveWorldBounds(ampMax, xMax), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [3.5, 0, 0],
        yaw: 0.4,
        pitch: 0.45,
        distance: 18,
        distanceMin: 7,
        distanceMax: 45,
      })
      anti = createParticleMesh({
        radius: 0.32,
        color: 0xfbbf24,
        emissive: 0x92400e,
      })
      node = createParticleMesh({
        radius: 0.28,
        color: 0xf472b6,
        emissive: 0x9d174d,
      })
      waveLine = createTrailLine(0x38bdf8)
      host.scene.add(anti)
      host.scene.add(node)
      host.scene.add(waveLine)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!anti || !node || !waveLine) return
      const yA = (ctx.live.yAnti ?? Number(snap.values.yAnti ?? 0)) * VIS
      const yN = (ctx.live.yNode ?? Number(snap.values.yNode ?? 0)) * VIS
      const xN = Number(snap.values.xNode ?? 1) * VIS
      anti.position.set(0, yA, 0)
      node.position.set(xN, yN, 0)
      const path = (snap.trails?.path ?? []).map((p) => [p[0]! * VIS, p[1]! * VIS, 0])
      setTrailPositions(waveLine, path)
      host.render()
    },

    dispose3d() {
      anti = null
      node = null
      waveLine = null
    },

    buildCompare: buildStandingWaveCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
