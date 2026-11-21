import type {
  CompareTrail,
  DemoAdapter,
  DemoAdapterContext,
} from '@/core/physics/adapter'
import type { ObserveSnapshot, ParamValues } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createParticleMesh, setTrailPositions } from '@/core/render/particle3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawWireBFrame, wireBWorldBounds } from './renderWireB2d'

const VIS = 1.5
const FIELD_RADII = [0.7, 1.25, 1.85, 2.5, 3.2]
const ARROWS_PER_RING = 4

export function buildWireBCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const R = Number(snap.values.R ?? 2)
  const path: number[][] = []
  const n = 64
  for (let i = 0; i <= n; i++) {
    const th = (2 * Math.PI * i) / n
    path.push([R * Math.cos(th), R * Math.sin(th)])
  }
  return { path, label: `R=${R}` }
}

function makeCirclePath(r: number, sense: 1 | -1, n = 64): number[][] {
  const path: number[][] = []
  for (let i = 0; i <= n; i++) {
    const th = sense * ((2 * Math.PI * i) / n)
    path.push([r * Math.cos(th) * VIS, r * Math.sin(th) * VIS, 0])
  }
  return path
}

export function createWireBAdapter(): DemoAdapter {
  let probe: Mesh | null = null
  let wire: Mesh | null = null
  let fieldGroup: Object3D | null = null
  let lastSense: 1 | -1 = 1

  function rebuildField(host: ThreeHost, sense: 1 | -1) {
    if (fieldGroup) {
      host.scene.remove(fieldGroup)
      fieldGroup.traverse((obj) => {
        const mesh = obj as Mesh
        mesh.geometry?.dispose?.()
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat?.dispose?.()
      })
    }
    fieldGroup = new THREE.Group()

    for (const r of FIELD_RADII) {
      const line = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({
          color: 0x34d399,
          transparent: true,
          opacity: 0.85,
        }),
      )
      setTrailPositions(line, makeCirclePath(r, sense))
      fieldGroup.add(line)

      for (let k = 0; k < ARROWS_PER_RING; k++) {
        const th = sense * ((2 * Math.PI * k) / ARROWS_PER_RING + 0.2)
        const x = r * Math.cos(th) * VIS
        const y = r * Math.sin(th) * VIS
        // I>0：逆时针切向 (−sin, cos)；I<0：顺时针
        const tx = -sense * Math.sin(th)
        const ty = sense * Math.cos(th)
        fieldGroup.add(
          new THREE.ArrowHelper(
            new THREE.Vector3(tx, ty, 0).normalize(),
            new THREE.Vector3(x, y, 0),
            0.55,
            0x34d399,
            0.22,
            0.14,
          ),
        )
      }
    }
    host.scene.add(fieldGroup)
    lastSense = sense
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 4.5)
      drawWireBFrame(host, snap, wireBWorldBounds(world), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.85,
        pitch: 0.65,
        distance: 16,
        distanceMin: 6,
        distanceMax: 40,
      })
      probe = createParticleMesh({
        radius: 0.28,
        color: 0xfbbf24,
        emissive: 0x92400e,
      })
      // 导线沿 z（与 2D「出纸面」一致），B 线在 xy 平面成圆
      wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 10, 20),
        new THREE.MeshStandardMaterial({
          color: 0xf87171,
          metalness: 0.35,
          roughness: 0.4,
          emissive: 0x7f1d1d,
          emissiveIntensity: 0.2,
        }),
      )
      wire.rotation.x = Math.PI / 2
      host.scene.add(probe)
      host.scene.add(wire)
      rebuildField(host, 1)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!probe) return
      const sense: 1 | -1 = Number(snap.values.I ?? 0) >= 0 ? 1 : -1
      if (sense !== lastSense || !fieldGroup) rebuildField(host, sense)

      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      const y = (ctx.live.y ?? Number(snap.values.y ?? 0)) * VIS
      probe.position.set(x, y, 0)
      host.render()
    },

    dispose3d() {
      probe = null
      wire = null
      fieldGroup = null
    },

    buildCompare: buildWireBCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
