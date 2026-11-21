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
import type { Line, Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { cyclotronWorldBounds, drawCyclotronFrame } from './renderCyclotron2d'

const VIS = 1.4

export function buildCyclotronCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const R = Number(snap.values.R ?? 2)
  const path: number[][] = []
  const n = 72
  for (let i = 0; i <= n; i++) {
    const th = (2 * Math.PI * i) / n
    path.push([R * Math.cos(th), R * Math.sin(th)])
  }
  return { path, label: `R=${R.toFixed(2)}` }
}

export function createCyclotronAdapter(): DemoAdapter {
  let ball: Mesh | null = null
  let trailLine: Line | null = null
  let bArrows: Object3D | null = null
  let lastBout = true

  function rebuildBArrows(host: ThreeHost, outOfPage: boolean) {
    if (bArrows) {
      host.scene.remove(bArrows)
      bArrows.traverse((obj) => {
        const m = obj as Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
    }
    bArrows = new THREE.Group()
    const dir = outOfPage ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 0, -1)
    const positions = [
      [2.2, 2.2],
      [-2.2, 2.2],
      [2.2, -2.2],
      [-2.2, -2.2],
      [0, 3],
      [0, -3],
      [3, 0],
      [-3, 0],
    ]
    for (const [x, y] of positions) {
      bArrows.add(
        new THREE.ArrowHelper(dir, new THREE.Vector3(x! * VIS, y! * VIS, -1.2), 2.2, 0x94a3b8, 0.35, 0.2),
      )
    }
    host.scene.add(bArrows)
    lastBout = outOfPage
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 4.5)
      drawCyclotronFrame(host, snap, cyclotronWorldBounds(world), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.75,
        pitch: 0.7,
        distance: 18,
        distanceMin: 6,
        distanceMax: 45,
      })
      ball = createParticleMesh({
        radius: 0.35,
        color: 0x38bdf8,
        emissive: 0x0c4a6e,
      })
      trailLine = createTrailLine(0x22d3ee)
      host.scene.add(ball)
      host.scene.add(trailLine)
      rebuildBArrows(host, true)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!ball || !trailLine) return
      const bout = Number(snap.values.Bout ?? 1) >= 0.5
      if (bout !== lastBout || !bArrows) rebuildBArrows(host, bout)

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
      bArrows = null
    },

    buildCompare: buildCyclotronCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
