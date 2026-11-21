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
import { drawPointChargeFrame, pointChargeWorldBounds } from './renderPointCharge2d'

const VIS = 1.6

export function buildPointChargeCompare(
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

export function createPointChargeAdapter(): DemoAdapter {
  let probe: Mesh | null = null
  let c1: Mesh | null = null
  let c2: Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 4.5)
      drawPointChargeFrame(host, snap, pointChargeWorldBounds(world), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.2, 0],
        yaw: 0.55,
        pitch: 0.5,
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
      host.scene.add(probe)
      host.scene.add(c1)
      host.scene.add(c2)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!probe || !c1 || !c2) return
      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      const y = (ctx.live.y ?? Number(snap.values.y ?? 0)) * VIS
      probe.position.set(x, y, 0)
      c1.position.set(Number(snap.values.q1x ?? 0) * VIS, 0, 0)
      c2.position.set(Number(snap.values.q2x ?? 0) * VIS, 0, 0)
      const Q1 = Number(snap.values.Q1 ?? 0)
      const Q2 = Number(snap.values.Q2 ?? 0)
      ;(c1.material as MeshStandardMaterial).color.setHex(Q1 >= 0 ? 0xf87171 : 0x38bdf8)
      ;(c2.material as MeshStandardMaterial).color.setHex(Q2 >= 0 ? 0xf87171 : 0x38bdf8)
      host.render()
    },

    dispose3d() {
      probe = null
      c1 = null
      c2 = null
    },

    buildCompare: buildPointChargeCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
