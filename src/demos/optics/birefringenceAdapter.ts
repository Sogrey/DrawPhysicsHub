import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { birefringenceWorldBounds, drawBirefringenceFrame } from './renderBirefringence2d'

/**
 * 3D 与 2D 一致：竖直晶体板（法线沿 +X）
 *   入射 ← 左侧面；o/e 在板内分叉；从右侧面出射（不是顶面）。
 */
export function createBirefringenceAdapter(): DemoAdapter {
  let slab: Mesh | null = null
  let axis: Object3D | null = null
  let rayIn: THREE.ArrowHelper | null = null
  let rayO: THREE.ArrowHelper | null = null
  let rayE: THREE.ArrowHelper | null = null
  let rayOOut: THREE.ArrowHelper | null = null
  let rayEOut: THREE.ArrowHelper | null = null
  let exitMarks: Object3D | null = null

  function setArrow(
    arrow: THREE.ArrowHelper,
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    length: number,
  ) {
    const d = dir.clone().normalize()
    arrow.position.copy(origin)
    arrow.setDirection(d)
    arrow.setLength(Math.max(0.15, length), 0.2, 0.11)
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 7)
      drawBirefringenceFrame(host, snap, birefringenceWorldBounds(world))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [2.2, 0.4, 0],
        yaw: 0.55,
        pitch: 0.32,
        distance: 11,
        distanceMin: 5,
        distanceMax: 26,
      })

      // 竖直板：厚度沿 X，高度 Y，进深 Z
      slab = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.22,
          metalness: 0.05,
          roughness: 0.75,
          depthWrite: false,
        }),
      )

      const axisGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.4, 0, 0),
        new THREE.Vector3(1.4, 0, 0),
      ])
      axis = new THREE.Line(
        axisGeo,
        new THREE.LineDashedMaterial({ color: 0xa78bfa, dashSize: 0.12, gapSize: 0.08 }),
      )
      ;(axis as THREE.Line).computeLineDistances()

      const mk = (color: number) =>
        new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, 0.2, 0.11)

      rayIn = mk(0x4ade80)
      rayO = mk(0x38bdf8)
      rayE = mk(0xfbbf24)
      rayOOut = mk(0x38bdf8)
      rayEOut = mk(0xfbbf24)

      exitMarks = new THREE.Group()
      const mkDot = (color: number) =>
        new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 12, 12),
          new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 }),
        )
      exitMarks.add(mkDot(0x38bdf8))
      exitMarks.add(mkDot(0xfbbf24))

      host.scene.add(slab)
      host.scene.add(axis)
      host.scene.add(rayIn)
      host.scene.add(rayO)
      host.scene.add(rayE)
      host.scene.add(rayOOut)
      host.scene.add(rayEOut)
      host.scene.add(exitMarks)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!slab || !rayIn || !rayO || !rayE || !rayOOut || !rayEOut || !exitMarks) return

      const L = Number(snap.values.L ?? 3.2)
      const thetaI = (Number(snap.values.thetaI ?? 0) * Math.PI) / 180
      const thetaO = (Number(snap.values.thetaO ?? 0) * Math.PI) / 180
      const thetaE = (Number(snap.values.thetaE ?? 0) * Math.PI) / 180
      const gamma = (Number(snap.values.gamma ?? 35) * Math.PI) / 180
      const yO = Number(snap.values.yO ?? L * Math.tan(thetaO))
      const yE = Number(snap.values.yE ?? L * Math.tan(thetaE))

      const xEnter = 0.9
      const xExit = xEnter + L
      const slabH = Math.max(4.2, Math.abs(yE) * 2.4 + 1.6)
      const slabD = 2.4

      // 板中心：左右面分别在 xEnter / xExit
      slab.scale.set(L, slabH, slabD)
      slab.position.set(xEnter + L / 2, Math.max(yO, yE) * 0.35, 0)

      if (axis) {
        axis.position.set(xEnter + L / 2, -slabH * 0.28, slabD * 0.35)
        axis.rotation.set(0, 0, gamma)
      }

      const lenIn = 2.4
      // 入射：左上方 → 左侧面中心 (xEnter, 0)；方向 (cos, −sin)
      const hit = new THREE.Vector3(xEnter, 0, 0)
      const inOrigin = new THREE.Vector3(
        xEnter - lenIn * Math.cos(thetaI),
        lenIn * Math.sin(thetaI),
        0,
      )
      setArrow(rayIn, inOrigin, new THREE.Vector3(Math.cos(thetaI), -Math.sin(thetaI), 0), lenIn)

      // 板内 o/e：从左侧面到右侧面（长度 = L / cosθ）
      const lenO = L / Math.max(0.2, Math.cos(thetaO))
      const lenE = L / Math.max(0.2, Math.cos(thetaE))
      setArrow(rayO, hit, new THREE.Vector3(Math.cos(thetaO), Math.sin(thetaO), 0), lenO)
      setArrow(rayE, hit, new THREE.Vector3(Math.cos(thetaE), Math.sin(thetaE), 0), lenE)

      // 出射：从右侧面继续（与入射同侧角，方向 (cos, +sin)）
      const outLen = 1.8
      const oExit = new THREE.Vector3(xExit, yO, 0)
      const eExit = new THREE.Vector3(xExit, yE, 0)
      const outDir = new THREE.Vector3(Math.cos(thetaI), Math.sin(thetaI), 0)
      setArrow(rayOOut, oExit, outDir, outLen)
      setArrow(rayEOut, eExit, outDir, outLen)

      const dots = exitMarks.children
      if (dots[0]) dots[0].position.copy(oExit)
      if (dots[1]) dots[1].position.copy(eExit)

      host.render()
    },

    dispose3d() {
      slab = null
      axis = null
      rayIn = null
      rayO = null
      rayE = null
      rayOOut = null
      rayEOut = null
      exitMarks = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
