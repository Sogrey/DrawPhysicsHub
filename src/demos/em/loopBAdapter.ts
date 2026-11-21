import type {
  CompareTrail,
  DemoAdapter,
  DemoAdapterContext,
} from '@/core/physics/adapter'
import type { ObserveSnapshot, ParamValues } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createParticleMesh } from '@/core/render/particle3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawLoopBFrame, loopBWorldBounds } from './renderLoopB2d'

const VIS = 1.4

export function buildLoopBCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const zMax = Number(snap.values.zMax ?? 3.2)
  return {
    path: [
      [-zMax, 0],
      [zMax, 0],
    ],
    label: '轴线',
  }
}

export function createLoopBAdapter(): DemoAdapter {
  let probe: Mesh | null = null
  let ring: Mesh | null = null
  let axisArrows: Object3D | null = null
  let bArrow: THREE.ArrowHelper | null = null
  let lastKey = ''

  function rebuildRing(host: ThreeHost, a: number, I: number) {
    if (ring) {
      host.scene.remove(ring)
      ring.geometry?.dispose?.()
      const mat = ring.material as THREE.Material
      mat?.dispose?.()
    }
    const tube = Math.max(0.06, a * 0.06)
    ring = new THREE.Mesh(
      new THREE.TorusGeometry(a * VIS, tube * VIS, 12, 64),
      new THREE.MeshStandardMaterial({
        color: 0xf87171,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.35,
        metalness: 0.3,
        roughness: 0.45,
      }),
    )
    // Torus 默认在 xy 平面；转到 yz 平面（轴沿 x）
    ring.rotation.y = Math.PI / 2
    host.scene.add(ring)

    if (axisArrows) {
      host.scene.remove(axisArrows)
      axisArrows.traverse((obj) => {
        const m = obj as Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
    }
    axisArrows = new THREE.Group()
    const sense = I >= 0 ? 1 : -1
    for (const x of [-a * 1.5, -a * 0.6, a * 0.6, a * 1.5].map((v) => v * VIS)) {
      axisArrows.add(
        new THREE.ArrowHelper(
          new THREE.Vector3(sense, 0, 0),
          new THREE.Vector3(x - sense * 0.35, 0, 0),
          0.7,
          0x60a5fa,
          0.18,
          0.1,
        ),
      )
    }
    host.scene.add(axisArrows)
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 4.5)
      drawLoopBFrame(host, snap, loopBWorldBounds(world), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.2, 0],
        yaw: 0.75,
        pitch: 0.42,
        distance: 14,
        distanceMin: 6,
        distanceMax: 32,
      })
      probe = createParticleMesh({
        radius: 0.22,
        color: 0xfbbf24,
        emissive: 0x92400e,
      })
      bArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(),
        1.2,
        0xfbbf24,
        0.2,
        0.11,
      )
      host.scene.add(probe)
      host.scene.add(bArrow)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!probe || !bArrow) return
      const a = Number(snap.values.a ?? 1.4)
      const I = Number(snap.values.I ?? 2)
      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      const Baxis = Number(snap.values.Baxis ?? 0)

      const key = `${a}|${I}`
      if (key !== lastKey) {
        rebuildRing(host, a, I)
        lastKey = key
      }

      probe.position.set(x, 0, 0)
      bArrow.position.set(x, 0, 0.05)
      if (Math.abs(Baxis) > 1e-6) {
        bArrow.visible = true
        const sense = Baxis >= 0 ? 1 : -1
        bArrow.setDirection(new THREE.Vector3(sense, 0, 0))
        bArrow.setLength(Math.min(2.2, 0.5 + 0.4 * Math.abs(Baxis)), 0.2, 0.11)
      } else {
        bArrow.visible = false
      }
      host.render()
    },

    dispose3d() {
      probe = null
      ring = null
      axisArrows = null
      bArrow = null
      lastKey = ''
    },

    buildCompare: buildLoopBCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
