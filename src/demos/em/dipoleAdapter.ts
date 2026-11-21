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
import { dipoleWorldBounds, drawDipoleFrame } from './renderDipole2d'

const VIS = 1.6

export function buildDipoleCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const R = Number(snap.values.R ?? 2.8)
  const path: number[][] = []
  const n = 64
  for (let i = 0; i <= n; i++) {
    const th = (2 * Math.PI * i) / n
    path.push([R * Math.cos(th), R * Math.sin(th)])
  }
  return { path, label: `R=${R}` }
}

export function createDipoleAdapter(): DemoAdapter {
  let probe: Mesh | null = null
  let cMinus: Mesh | null = null
  let cPlus: Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 4.5)
      drawDipoleFrame(host, snap, dipoleWorldBounds(world), {
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
      cMinus = createParticleMesh({
        radius: 0.4,
        color: 0x38bdf8,
        emissive: 0x0c4a6e,
      })
      cPlus = createParticleMesh({
        radius: 0.4,
        color: 0xf87171,
        emissive: 0x7f1d1d,
      })
      host.scene.add(probe)
      host.scene.add(cMinus)
      host.scene.add(cPlus)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!probe || !cMinus || !cPlus) return
      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      const y = (ctx.live.y ?? Number(snap.values.y ?? 0)) * VIS
      probe.position.set(x, y, 0)
      cMinus.position.set(Number(snap.values.qMinusX ?? 0) * VIS, 0, 0)
      cPlus.position.set(Number(snap.values.qPlusX ?? 0) * VIS, 0, 0)
      ;(cMinus.material as MeshStandardMaterial).color.setHex(0x38bdf8)
      ;(cPlus.material as MeshStandardMaterial).color.setHex(0xf87171)
      host.render()
    },

    dispose3d() {
      probe = null
      cMinus = null
      cPlus = null
    },

    buildCompare: buildDipoleCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
