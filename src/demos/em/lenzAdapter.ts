import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawLenzFrame, lenzWorldBounds } from './renderLenz2d'

const VIS = 1.2

export function createLenzAdapter(): DemoAdapter {
  let loop: Mesh | null = null
  let bArrows: Object3D | null = null
  let currentGroup: Object3D | null = null
  let lastSense = 0
  let lastBSign = 0
  let lastSide = 0

  function rebuildB(host: ThreeHost, B: number, side: number) {
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
    const out = B >= 0
    const dir = out ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 0, -1)
    const len = 0.8 + 1.4 * Math.min(1, Math.abs(B))
    const h = side * VIS * 0.35
    const pts = [
      [h, h],
      [-h, h],
      [h, -h],
      [-h, -h],
      [0, h * 1.1],
      [0, -h * 1.1],
      [h * 1.1, 0],
      [-h * 1.1, 0],
    ]
    for (const [x, y] of pts) {
      bArrows.add(
        new THREE.ArrowHelper(
          dir,
          new THREE.Vector3(x! * VIS, y! * VIS, -len * 0.5),
          len,
          0x94a3b8,
          0.28,
          0.16,
        ),
      )
    }
    host.scene.add(bArrows)
  }

  function rebuildCurrent(host: ThreeHost, sense: number, side: number, Iabs: number) {
    if (currentGroup) {
      host.scene.remove(currentGroup)
      currentGroup.traverse((obj) => {
        const m = obj as Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
    }
    currentGroup = new THREE.Group()
    if (Math.abs(sense) < 0.5 || Iabs < 0.05) {
      host.scene.add(currentGroup)
      lastSense = sense
      return
    }
    const half = (side / 2) * VIS
    const s = sense > 0 ? 1 : -1
    const edges: { origin: THREE.Vector3; dir: THREE.Vector3 }[] = [
      {
        origin: new THREE.Vector3(-half * 0.5, -half, 0.15),
        dir: new THREE.Vector3(s, 0, 0),
      },
      {
        origin: new THREE.Vector3(half, -half * 0.5, 0.15),
        dir: new THREE.Vector3(0, s, 0),
      },
      {
        origin: new THREE.Vector3(half * 0.5, half, 0.15),
        dir: new THREE.Vector3(-s, 0, 0),
      },
      {
        origin: new THREE.Vector3(-half, half * 0.5, 0.15),
        dir: new THREE.Vector3(0, -s, 0),
      },
    ]
    for (const e of edges) {
      currentGroup.add(
        new THREE.ArrowHelper(e.dir.normalize(), e.origin, half * 0.9, 0x34d399, 0.28, 0.16),
      )
    }
    host.scene.add(currentGroup)
    lastSense = sense
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 4.5)
      drawLenzFrame(host, snap, lenzWorldBounds(world))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.7,
        pitch: 0.75,
        distance: 16,
        distanceMin: 6,
        distanceMax: 40,
      })
      const geo = new THREE.PlaneGeometry(1, 1)
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.2,
        roughness: 0.5,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        emissive: 0x78350f,
        emissiveIntensity: 0.15,
      })
      loop = new THREE.Mesh(geo, mat)
      // edge frame
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
      )
      loop.add(edges)
      host.scene.add(loop)
      rebuildB(host, 0, 2)
      rebuildCurrent(host, 0, 2, 0)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!loop) return
      const side = Number(snap.values.side ?? 2)
      const B = Number(snap.values.B ?? 0)
      const sense = Number(snap.values.sense ?? 0)
      const I = Number(snap.values.I ?? 0)
      loop.scale.set(side * VIS, side * VIS, 1)
      const bSign = B >= 0 ? 1 : -1
      if (bSign !== lastBSign || Math.abs(side - lastSide) > 0.05 || !bArrows) {
        rebuildB(host, B, side)
        lastBSign = bSign
        lastSide = side
      }
      const senseKey = Math.abs(I) < 0.05 ? 0 : sense
      if (senseKey !== lastSense || Math.abs(side - lastSide) > 0.05) {
        rebuildCurrent(host, senseKey, side, Math.abs(I))
      }
      host.render()
    },

    dispose3d() {
      loop = null
      bArrows = null
      currentGroup = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
