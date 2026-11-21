import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawMotionalEmfFrame, motionalEmfWorldBounds } from './renderMotionalEmf2d'

const VIS = 1.2

function makeLine(pts: THREE.Vector3[], color: number, dash = false): THREE.Line {
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  const mat = dash
    ? new THREE.LineDashedMaterial({
        color,
        dashSize: 0.12,
        gapSize: 0.08,
        transparent: true,
        opacity: 0.9,
      })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })
  const line = new THREE.Line(geo, mat)
  if (dash) line.computeLineDistances()
  return line
}

export function createMotionalEmfAdapter(): DemoAdapter {
  let rails: Object3D | null = null
  let bar: Mesh | null = null
  let area: Mesh | null = null
  let areaOutline: THREE.Line | null = null
  let vArrow: THREE.ArrowHelper | null = null
  let fArrow: THREE.ArrowHelper | null = null
  let bArrows: Object3D | null = null
  let iArrows: Object3D | null = null
  let guides: Object3D | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 5.5)
      drawMotionalEmfFrame(host, snap, motionalEmfWorldBounds(world))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [2, 0.2, 0.3],
        yaw: 0.7,
        pitch: 0.5,
        distance: 15,
        distanceMin: 6,
        distanceMax: 32,
      })

      rails = new THREE.Group()
      const railMat = new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        metalness: 0.35,
        roughness: 0.4,
      })
      for (const y of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.08, 0.08), railMat)
        rail.position.set(2.5, y * VIS, 0)
        rails.add(rail)
      }
      const end = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.1 * VIS, 0.08), railMat)
      end.position.set(0, 0, 0)
      rails.add(end)

      bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 2 * VIS, 14),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0x92400e,
          emissiveIntensity: 0.3,
          metalness: 0.3,
          roughness: 0.4,
        }),
      )

      area = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        }),
      )
      area.position.set(0, 0, -0.05)

      areaOutline = makeLine(
        [
          new THREE.Vector3(0, 1, 0.02),
          new THREE.Vector3(1, 1, 0.02),
          new THREE.Vector3(1, -1, 0.02),
          new THREE.Vector3(0, -1, 0.02),
          new THREE.Vector3(0, 1, 0.02),
        ],
        0x38bdf8,
        true,
      )

      vArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(),
        1.2,
        0x7dd3fc,
        0.2,
        0.1,
      )
      fArrow = new THREE.ArrowHelper(
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(),
        1.2,
        0xf472b6,
        0.2,
        0.1,
      )

      // B 场辅助箭头（出纸面 +z）
      bArrows = new THREE.Group()
      for (let i = 0; i < 3; i++) {
        for (let j = -1; j <= 1; j++) {
          bArrows.add(
            new THREE.ArrowHelper(
              new THREE.Vector3(0, 0, 1),
              new THREE.Vector3(0.7 + i * 1.1, j * 0.7 * VIS, -0.85),
              1.0,
              0x94a3b8,
              0.14,
              0.08,
            ),
          )
        }
      }

      iArrows = new THREE.Group()
      guides = new THREE.Group()

      host.scene.add(rails)
      host.scene.add(bar)
      host.scene.add(area)
      host.scene.add(areaOutline)
      host.scene.add(vArrow)
      host.scene.add(fArrow)
      host.scene.add(bArrows)
      host.scene.add(iArrows)
      host.scene.add(guides)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!bar || !area || !vArrow || !fArrow || !areaOutline || !iArrows || !guides) return
      const L = Number(snap.values.L ?? 2) * VIS
      const x = Number(snap.values.x ?? 1) * VIS
      const v = Number(snap.values.v ?? 0.8)
      const Fx = Number(snap.values.Fx ?? 0)
      const I = Number(snap.values.I ?? 0)
      const Bout = Number(snap.values.Bout ?? 1) >= 0.5
      const half = L / 2

      bar.scale.set(1, L / (2 * VIS), 1)
      bar.position.set(x, 0, 0)

      area.scale.set(Math.max(0.05, x), L, 1)
      area.position.set(x / 2, 0, -0.05)

      // 面积轮廓随 x、L 更新
      const outlinePts = [
        new THREE.Vector3(0, half, 0.03),
        new THREE.Vector3(x, half, 0.03),
        new THREE.Vector3(x, -half, 0.03),
        new THREE.Vector3(0, -half, 0.03),
        new THREE.Vector3(0, half, 0.03),
      ]
      areaOutline.geometry.dispose()
      areaOutline.geometry = new THREE.BufferGeometry().setFromPoints(outlinePts)
      areaOutline.computeLineDistances()

      vArrow.position.set(x, 0.2, 0.25)
      vArrow.setDirection(new THREE.Vector3(1, 0, 0))
      vArrow.setLength(Math.min(2, 0.5 + v), 0.2, 0.1)

      fArrow.position.set(x, -0.35, 0.25)
      if (Math.abs(Fx) > 0.05) {
        fArrow.visible = true
        const dir = Fx >= 0 ? 1 : -1
        fArrow.setDirection(new THREE.Vector3(dir, 0, 0))
        fArrow.setLength(Math.min(2, 0.4 + 0.3 * Math.abs(Fx)), 0.2, 0.1)
      } else {
        fArrow.visible = false
      }

      // B 方向
      if (bArrows) {
        const bz = Bout ? 1 : -1
        for (const child of bArrows.children) {
          const ah = child as THREE.ArrowHelper
          ah.setDirection(new THREE.Vector3(0, 0, bz))
          ah.position.z = Bout ? -0.85 : 0.85
        }
      }

      // 电流回路箭头（四边）
      while (iArrows.children.length) {
        const c = iArrows.children.pop()!
        iArrows.remove(c)
      }
      if (Math.abs(I) > 0.05 && x > 0.3) {
        const s = 0.2
        // 顺时针：上 ← 右 ↓ 下 → 左 ↑
        iArrows.add(
          new THREE.ArrowHelper(
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(x * 0.65, half, 0.2),
            Math.max(0.4, x * 0.4),
            0x4ade80,
            0.14,
            0.08,
          ),
        )
        iArrows.add(
          new THREE.ArrowHelper(
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(x, half * 0.35, 0.2),
            Math.max(0.4, L * 0.45),
            0x4ade80,
            0.14,
            0.08,
          ),
        )
        iArrows.add(
          new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(x * 0.25, -half, 0.2),
            Math.max(0.4, x * 0.4),
            0x4ade80,
            0.14,
            0.08,
          ),
        )
        iArrows.add(
          new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, -half * 0.35, 0.2),
            Math.max(0.4, L * 0.45),
            0x4ade80,
            0.14,
            0.08,
          ),
        )
        void s
      }

      // 辅助：L 尺寸线、x 尺寸线、v/F 对峙虚线
      while (guides.children.length) {
        const c = guides.children.pop()!
        guides.remove(c)
        const geo = (c as THREE.Line).geometry
        geo?.dispose?.()
        const mat = (c as THREE.Line).material as THREE.Material | undefined
        mat?.dispose?.()
      }
      guides.add(
        makeLine(
          [new THREE.Vector3(-0.25, -half, 0), new THREE.Vector3(-0.25, half, 0)],
          0xfbbf24,
          true,
        ),
      )
      guides.add(
        makeLine(
          [new THREE.Vector3(0, -half - 0.35, 0), new THREE.Vector3(x, -half - 0.35, 0)],
          0x7dd3fc,
          true,
        ),
      )
      if (Math.abs(Fx) > 0.05) {
        guides.add(
          makeLine(
            [new THREE.Vector3(x - 1.2, 0, 0.15), new THREE.Vector3(x + 1.2, 0, 0.15)],
            0xf472b6,
            true,
          ),
        )
      }

      host.render()
    },

    dispose3d() {
      rails = null
      bar = null
      area = null
      areaOutline = null
      vArrow = null
      fArrow = null
      bArrows = null
      iArrows = null
      guides = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
