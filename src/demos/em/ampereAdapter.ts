import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { ampereWorldBounds, drawAmpereFrame } from './renderAmpere2d'

function makeGuideLine(a: THREE.Vector3, b: THREE.Vector3, color: number, dash = false): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints([a, b])
  const mat = dash
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.85 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 })
  const line = new THREE.Line(geo, mat)
  if (dash) line.computeLineDistances()
  return line
}

export function createAmpereAdapter(): DemoAdapter {
  let wire: Mesh | null = null
  let fArrow: THREE.ArrowHelper | null = null
  let iArrow: THREE.ArrowHelper | null = null
  let bArrow: THREE.ArrowHelper | null = null
  let bMarks: Object3D | null = null
  let guides: Object3D | null = null
  let plane: Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 5)
      drawAmpereFrame(host, snap, ampereWorldBounds(world))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.3, 0.2],
        yaw: 0.7,
        pitch: 0.48,
        distance: 13,
        distanceMin: 5,
        distanceMax: 28,
      })

      // 场区底板（辅助理解 B 穿过平面）
      plane = new THREE.Mesh(
        new THREE.PlaneGeometry(7, 5.5),
        new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
          metalness: 0.05,
          roughness: 0.9,
        }),
      )
      plane.position.set(0, 0, -0.02)

      // 底板边框
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(7, 5.5)),
        new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.7 }),
      )
      edges.position.copy(plane.position)

      wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1, 16),
        new THREE.MeshStandardMaterial({
          color: 0x4ade80,
          metalness: 0.4,
          roughness: 0.35,
          emissive: 0x14532d,
          emissiveIntensity: 0.25,
        }),
      )

      iArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(),
        1.5,
        0x4ade80,
        0.22,
        0.12,
      )
      fArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(),
        1.5,
        0xf472b6,
        0.22,
        0.12,
      )
      // B 主箭头（出/入纸面 → ±z）
      bArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(2.2, 1.6, -0.9),
        1.8,
        0x94a3b8,
        0.22,
        0.12,
      )

      bMarks = new THREE.Group()
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          if (Math.abs(i) + Math.abs(j) === 0) continue
          const stem = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(i * 0.95, j * 0.85, -0.9),
            0.85,
            0x94a3b8,
            0.12,
            0.08,
          )
          bMarks.add(stem)
        }
      }

      guides = new THREE.Group()

      host.scene.add(plane)
      host.scene.add(edges)
      host.scene.add(wire)
      host.scene.add(iArrow)
      host.scene.add(fArrow)
      host.scene.add(bArrow)
      host.scene.add(bMarks)
      host.scene.add(guides)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!wire || !iArrow || !fArrow || !bArrow || !guides) return
      const L = Number(snap.values.L ?? 2.4)
      const I = Number(snap.values.I ?? 0)
      const alpha = (Number(snap.values.alpha ?? 0) * Math.PI) / 180
      const Fx = Number(snap.values.Fx ?? 0)
      const Fy = Number(snap.values.Fy ?? 0)
      const Fmag = Number(snap.values.Fmag ?? 0)
      const cx = Number(snap.values.cx ?? 0)
      const cy = Number(snap.values.cy ?? 0)
      const Bout = Number(snap.values.Bout ?? 1) >= 0.5

      const lx = Math.cos(alpha)
      const ly = Math.sin(alpha)

      wire.scale.set(1, L, 1)
      wire.position.set(cx, cy, 0)
      wire.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(lx, ly, 0).normalize(),
      )

      const idir = I >= 0 ? 1 : -1
      iArrow.visible = Math.abs(I) > 0.05
      iArrow.position.set(cx - lx * 0.3 * idir, cy - ly * 0.3 * idir, 0.15)
      iArrow.setDirection(new THREE.Vector3(lx * idir, ly * idir, 0))
      iArrow.setLength(Math.min(L * 0.7, 2.2), 0.22, 0.12)

      fArrow.position.set(cx, cy, 0.25)
      if (Fmag > 0.08) {
        fArrow.visible = true
        fArrow.setDirection(new THREE.Vector3(Fx / Fmag, Fy / Fmag, 0))
        fArrow.setLength(Math.min(2.4, 0.5 + 0.28 * Fmag), 0.22, 0.12)
      } else {
        fArrow.visible = false
      }

      // B 方向
      const bz = Bout ? 1 : -1
      bArrow.setDirection(new THREE.Vector3(0, 0, bz))
      bArrow.position.set(2.2, 1.6, Bout ? -0.9 : 0.9)
      if (bMarks) {
        for (const child of bMarks.children) {
          const ah = child as THREE.ArrowHelper
          ah.setDirection(new THREE.Vector3(0, 0, bz))
          ah.position.z = Bout ? -0.9 : 0.9
        }
      }

      // 辅助线：I / F / B 三轴示意 + 导线两端垂线
      while (guides.children.length) {
        const c = guides.children.pop()!
        guides.remove(c)
        const m = c as Mesh
        m.geometry?.dispose?.()
        const mat = (c as THREE.Line).material as THREE.Material | undefined
        mat?.dispose?.()
      }
      const half = L / 2
      guides.add(
        makeGuideLine(
          new THREE.Vector3(cx - lx * half, cy - ly * half, 0),
          new THREE.Vector3(cx + lx * half, cy + ly * half, 0),
          0x4ade80,
          true,
        ),
      )
      if (Fmag > 0.08) {
        const ux = Fx / Fmag
        const uy = Fy / Fmag
        guides.add(
          makeGuideLine(
            new THREE.Vector3(cx, cy, 0),
            new THREE.Vector3(cx + ux * 2.2, cy + uy * 2.2, 0),
            0xf472b6,
            true,
          ),
        )
        // 正交辅助折线
        guides.add(
          makeGuideLine(
            new THREE.Vector3(cx + lx * 0.45 * idir, cy + ly * 0.45 * idir, 0),
            new THREE.Vector3(cx + lx * 0.45 * idir + ux * 0.45, cy + ly * 0.45 * idir + uy * 0.45, 0),
            0xe2e8f0,
          ),
        )
      }
      guides.add(
        makeGuideLine(
          new THREE.Vector3(cx, cy, -1.1),
          new THREE.Vector3(cx, cy, 1.1),
          0x94a3b8,
          true,
        ),
      )

      host.render()
    },

    dispose3d() {
      wire = null
      fArrow = null
      iArrow = null
      bArrow = null
      bMarks = null
      guides = null
      plane = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
