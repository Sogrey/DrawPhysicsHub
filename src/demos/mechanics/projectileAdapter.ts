import type {
  CompareTrail,
  DemoAdapter,
  DemoAdapterContext,
} from '@/core/physics/adapter'
import type { ObserveSnapshot, ParamValues } from '@/core/physics/types'
import type { ThreeHost } from '@/core/render/threeHost'
import {
  createDashedTrailLine,
  createParticleMesh,
  createTrailLine,
  setTrailPositions,
} from '@/core/render/particle3d'
import {
  drawProjectileFrame,
  projectileWorldBounds,
  VELOCITY_ARROW_SCALE,
} from './renderProjectile2d'
import {
  syncProjectileThree,
  updateProjectileGhostLine,
} from './renderProjectile3d'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { Line, Mesh } from 'three'

const G = 9.8

export function buildProjectileCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const theory: number[][] = []
  const v0 = Number(snap.values.v0 ?? 20)
  const angle = Number(snap.values.angle ?? 45)
  const th = (angle * Math.PI) / 180
  const T = (2 * v0 * Math.sin(th)) / G
  const n = 64
  for (let i = 0; i <= n; i++) {
    const tt = (T * i) / n
    theory.push([
      v0 * Math.cos(th) * tt,
      Math.max(0, v0 * Math.sin(th) * tt - 0.5 * G * tt * tt),
    ])
  }
  return { path: theory, label: `θ=${angle}°` }
}

export function createProjectileAdapter(): DemoAdapter {
  let ball: Mesh | null = null
  let trailLine: Line | null = null
  let ghostLine: Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const v0 = Number(ctx.params.v0 ?? snap.values.v0 ?? 20)
      drawProjectileFrame(host, snap, projectileWorldBounds(ctx.live, v0), {
        showDecomp: true,
        compare: ctx.compare,
        velocityScale: VELOCITY_ARROW_SCALE,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [18, 4, 0],
        yaw: 0.55,
        pitch: 0.42,
        distance: 70,
        distanceMin: 20,
        distanceMax: 140,
      })
      ball = createParticleMesh()
      trailLine = createTrailLine(0x38bdf8)
      ghostLine = createDashedTrailLine(0xf97316)
      host.scene.add(ball)
      host.scene.add(trailLine)
      host.scene.add(ghostLine)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!ball || !trailLine) return
      syncProjectileThree(host, ball, trailLine, {
        x: ctx.live.x ?? Number(snap.values.x ?? 0),
        y: ctx.live.y ?? Number(snap.values.y ?? 0),
        path: snap.trails?.path ?? [],
      })
      if (ghostLine) updateProjectileGhostLine(ghostLine, snap)
    },

    dispose3d() {
      ball = null
      trailLine = null
      ghostLine = null
    },

    buildCompare: buildProjectileCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
