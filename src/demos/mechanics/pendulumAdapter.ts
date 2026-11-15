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
import * as THREE from 'three'
import type { Line, Mesh } from 'three'
import { drawPendulumFrame, pendulumWorldBounds } from './renderPendulum2d'

const VIS = 5

export function buildPendulumCompare(snap: ObserveSnapshot, _params?: ParamValues): CompareTrail {
  const L = Number(snap.values.L ?? 1)
  const th0 = ((Number(snap.values.theta0 ?? 20) * Math.PI) / 180) * 1.35
  const path: number[][] = []
  const n = 48
  for (let i = 0; i <= n; i++) {
    const th = -th0 + (2 * th0 * i) / n
    path.push([L * Math.sin(th), -L * Math.cos(th)])
  }
  return { path, label: '更大振幅弧' }
}

export function createPendulumAdapter(): DemoAdapter {
  let bob: Mesh | null = null
  let trailLine: Line | null = null
  let rod: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const L = Number(ctx.params.L ?? snap.values.L ?? 1)
      drawPendulumFrame(host, snap, pendulumWorldBounds(L), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, -2, 0],
        yaw: 0.35,
        pitch: 0.25,
        distance: 14,
        distanceMin: 5,
        distanceMax: 40,
      })
      bob = createParticleMesh({
        radius: 0.35,
        color: 0xf97316,
        emissive: 0x7c2d12,
      })
      trailLine = createTrailLine(0x38bdf8)
      const rodGeo = new THREE.BufferGeometry()
      rodGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
      rod = new THREE.Line(rodGeo, new THREE.LineBasicMaterial({ color: 0xcbd5e1 }))
      host.scene.add(bob)
      host.scene.add(trailLine)
      host.scene.add(rod)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!bob || !trailLine || !rod) return
      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      const y = (ctx.live.y ?? Number(snap.values.y ?? 0)) * VIS
      bob.position.set(x, y, 0)
      const pos = rod.geometry.attributes.position as THREE.BufferAttribute
      pos.setXYZ(0, 0, 0, 0)
      pos.setXYZ(1, x, y, 0)
      pos.needsUpdate = true
      setTrailPositions(
        trailLine,
        (snap.trails?.path ?? []).map((p) => [p[0]! * VIS, p[1]! * VIS, 0]),
      )
      host.render()
    },

    dispose3d() {
      bob = null
      trailLine = null
      rod = null
    },

    buildCompare: buildPendulumCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
