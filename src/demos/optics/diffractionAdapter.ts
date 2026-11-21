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
import { diffractionWorldBounds, drawDiffractionFrame } from './renderDiffraction2d'

const VIS = 1

export function buildDiffractionCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const L = Number(snap.values.L ?? 6)
  const y = Number(snap.values.y ?? 0)
  return {
    path: [
      [0, 0],
      [L, y],
    ],
    label: '光路',
  }
}

export function createDiffractionAdapter(): DemoAdapter {
  let probe: Mesh | null = null
  let screen: Mesh | null = null
  let slit: Object3D | null = null
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
    const n = Number(snap.values.nScreen ?? 70)
    const screenI = snap.values.screenI
    if (screenI instanceof Float32Array) {
      const step = (2 * yMax) / Math.max(1, n - 1)
      for (let i = 0; i < n; i += 2) {
        const I = screenI[i]!
        const y = -yMax + step * i
        const h = Math.max(0.08, step * 1.5)
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, h, 0.08 + 0.85 * I),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color().setRGB(0.2 + 0.3 * I, 0.4 + 0.4 * I, 0.5 + 0.5 * I),
            emissive: 0x0284c7,
            emissiveIntensity: 0.1 + 0.6 * I,
            metalness: 0.1,
            roughness: 0.5,
          }),
        )
        bar.position.set(L, y, 0.15 * I)
        intensityBars.add(bar)
      }
    }
    host.scene.add(intensityBars)
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const worldX = Number(snap.values.worldX ?? 8)
      const worldY = Number(snap.values.worldY ?? 5)
      drawDiffractionFrame(host, snap, diffractionWorldBounds(worldX, worldY), {
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
      slit = new THREE.Group()
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 8, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x475569 }),
      )
      const open = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 1, 0.22),
        new THREE.MeshStandardMaterial({ color: 0xf87171, emissive: 0x7f1d1d }),
      )
      slit.add(wall)
      slit.add(open)
      host.scene.add(probe)
      host.scene.add(screen)
      host.scene.add(slit)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!probe || !screen || !slit) return
      const L = Number(snap.values.L ?? 6) * VIS
      const a = Number(snap.values.a ?? 1) * VIS
      const y = (ctx.live.y ?? Number(snap.values.y ?? 0)) * VIS
      const yMax = Number(snap.values.yMax ?? 4) * VIS
      probe.position.set(L, y, 0.3)
      screen.position.set(L, 0, 0)
      screen.scale.set(1, yMax / 5, 1)
      const open = slit.children[1] as Mesh | undefined
      if (open) open.scale.set(1, Math.max(0.2, a), 1)

      const key = `${snap.values.lambda}|${snap.values.a}|${snap.values.L}`
      if (key !== lastKey) {
        rebuildScreen(host, snap)
        lastKey = key
      }
      host.render()
    },

    dispose3d() {
      probe = null
      screen = null
      slit = null
      intensityBars = null
      lastKey = ''
    },

    buildCompare: buildDiffractionCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
