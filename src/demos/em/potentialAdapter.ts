import type {
  CompareTrail,
  DemoAdapter,
  DemoAdapterContext,
} from '@/core/physics/adapter'
import type { ObserveSnapshot, ParamValues } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createParticleMesh } from '@/core/render/particle3d'
import type { Mesh, MeshStandardMaterial } from 'three'
import * as THREE from 'three'
import { drawPotentialFrame, potentialWorldBounds } from './renderPotential2d'

const VIS = 1.6

export function buildPotentialCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const R = Number(snap.values.R ?? 2.2)
  const path: number[][] = []
  const n = 64
  for (let i = 0; i <= n; i++) {
    const th = (2 * Math.PI * i) / n
    path.push([R * Math.cos(th), R * Math.sin(th)])
  }
  return { path, label: `R=${R}` }
}

export function createPotentialAdapter(): DemoAdapter {
  let probe: Mesh | null = null
  let c1: Mesh | null = null
  let c2: Mesh | null = null
  let eArrow: THREE.ArrowHelper | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 4.5)
      drawPotentialFrame(host, snap, potentialWorldBounds(world), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.3, 0],
        yaw: 0.55,
        pitch: 0.55,
        distance: 16,
        distanceMin: 6,
        distanceMax: 40,
      })
      probe = createParticleMesh({
        radius: 0.28,
        color: 0xfbbf24,
        emissive: 0x92400e,
      })
      c1 = createParticleMesh({
        radius: 0.45,
        color: 0xf87171,
        emissive: 0x7f1d1d,
      })
      c2 = createParticleMesh({
        radius: 0.45,
        color: 0x38bdf8,
        emissive: 0x0c4a6e,
      })
      eArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(),
        1.2,
        0xf472b6,
        0.22,
        0.12,
      )
      host.scene.add(probe)
      host.scene.add(c1)
      host.scene.add(c2)
      host.scene.add(eArrow)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!probe || !c1 || !c2 || !eArrow) return
      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      const y = (ctx.live.y ?? Number(snap.values.y ?? 0)) * VIS
      probe.position.set(x, y, 0)
      c1.position.set(Number(snap.values.q1x ?? 0) * VIS, 0, 0)
      c2.position.set(Number(snap.values.q2x ?? 0) * VIS, 0, 0)
      const Q1 = Number(snap.values.Q1 ?? 0)
      const Q2 = Number(snap.values.Q2 ?? 0)
      ;(c1.material as MeshStandardMaterial).color.setHex(Q1 >= 0 ? 0xf87171 : 0x38bdf8)
      ;(c2.material as MeshStandardMaterial).color.setHex(Q2 >= 0 ? 0xf87171 : 0x38bdf8)

      const Ex = Number(snap.values.Ex ?? 0)
      const Ey = Number(snap.values.Ey ?? 0)
      const Em = Math.hypot(Ex, Ey)
      eArrow.position.set(x, y, 0.1)
      if (Em > 1e-6) {
        eArrow.visible = true
        eArrow.setDirection(new THREE.Vector3(Ex / Em, Ey / Em, 0))
        eArrow.setLength(Math.min(2.2, 0.6 + 0.35 * Math.log1p(Em)), 0.22, 0.12)
      } else {
        eArrow.visible = false
      }
      host.render()
    },

    dispose3d() {
      probe = null
      c1 = null
      c2 = null
      eArrow = null
    },

    buildCompare: buildPotentialCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
