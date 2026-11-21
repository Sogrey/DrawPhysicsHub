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
import { doubleSlitWorldBounds, drawDoubleSlitFrame } from './renderDoubleSlit2d'

const VIS = 1.0

export function buildDoubleSlitCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const d = Number(snap.values.d ?? 1.2)
  const L = Number(snap.values.L ?? 6)
  const y = Number(snap.values.y ?? 0)
  return {
    path: [
      [0, d / 2],
      [L, y],
      [0, -d / 2],
    ],
    label: '光路',
  }
}

export function createDoubleSlitAdapter(): DemoAdapter {
  let probe: Mesh | null = null
  let screen: Mesh | null = null
  let slits: Object3D | null = null
  let intensityBars: Object3D | null = null
  let lastKey = ''

  function rebuildScreen(host: ThreeHost, snap: ObserveSnapshot) {
    if (intensityBars) {
      host.scene.remove(intensityBars)
      intensityBars.traverse((obj) => {
        const m = obj as Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
    }
    intensityBars = new THREE.Group()
    const L = Number(snap.values.L ?? 6) * VIS
    const yMax = Number(snap.values.yMax ?? 4) * VIS
    const n = Number(snap.values.nScreen ?? 60)
    const screenI = snap.values.screenI
    if (screenI instanceof Float32Array) {
      const step = (2 * yMax) / Math.max(1, n - 1)
      for (let i = 0; i < n; i += 2) {
        const I = screenI[i]!
        const y = -yMax + step * i
        const h = Math.max(0.08, step * 1.6)
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, h, 0.08 + 0.7 * I),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color().setRGB(0.2 + 0.3 * I, 0.45 + 0.4 * I, 0.55 + 0.45 * I),
            emissive: 0x0ea5e9,
            emissiveIntensity: 0.15 + 0.55 * I,
            metalness: 0.1,
            roughness: 0.5,
          }),
        )
        bar.position.set(L, y, 0.2 * I)
        intensityBars.add(bar)
      }
    }
    host.scene.add(intensityBars)
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const worldX = Number(snap.values.worldX ?? 8)
      const worldY = Number(snap.values.worldY ?? 5)
      drawDoubleSlitFrame(host, snap, doubleSlitWorldBounds(worldX, worldY), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [3, 0, 0],
        yaw: 0.55,
        pitch: 0.55,
        distance: 16,
        distanceMin: 6,
        distanceMax: 40,
      })
      probe = createParticleMesh({
        radius: 0.22,
        color: 0xfbbf24,
        emissive: 0x92400e,
      })
      screen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, 10),
        new THREE.MeshStandardMaterial({
          color: 0x334155,
          metalness: 0.2,
          roughness: 0.7,
          side: THREE.DoubleSide,
        }),
      )
      slits = new THREE.Group()
      for (const y of [0.6, -0.6]) {
        const s = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.25, 0.2),
          new THREE.MeshStandardMaterial({ color: 0xf87171, emissive: 0x7f1d1d }),
        )
        s.position.set(0, y, 0)
        slits.add(s)
      }
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 8, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x475569 }),
      )
      wall.position.set(0, 0, -0.2)
      slits.add(wall)
      host.scene.add(probe)
      host.scene.add(screen)
      host.scene.add(slits)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!probe || !screen || !slits) return
      const L = Number(snap.values.L ?? 6) * VIS
      const d = Number(snap.values.d ?? 1.2) * VIS
      const y = (ctx.live.y ?? Number(snap.values.y ?? 0)) * VIS
      const yMax = Number(snap.values.yMax ?? 4) * VIS
      probe.position.set(L, y, 0.3)
      screen.position.set(L, 0, 0)
      screen.scale.set(1, yMax / 5, 1)
      slits.children[0] && ((slits.children[0] as Mesh).position.y = d / 2)
      slits.children[1] && ((slits.children[1] as Mesh).position.y = -d / 2)

      const key = `${snap.values.lambda}|${snap.values.d}|${snap.values.L}`
      if (key !== lastKey) {
        rebuildScreen(host, snap)
        lastKey = key
      }
      host.render()
    },

    dispose3d() {
      probe = null
      screen = null
      slits = null
      intensityBars = null
      lastKey = ''
    },

    buildCompare: buildDoubleSlitCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
