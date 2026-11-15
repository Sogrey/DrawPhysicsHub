import type {
  CompareTrail,
  DemoAdapter,
  DemoAdapterContext,
} from '@/core/physics/adapter'
import type { ObserveSnapshot, ParamValues } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTrailLine, setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'
import type { Line, Mesh } from 'three'
import { drawRollingFrame, rollingWorldBounds } from './renderRolling2d'

const VIS = 3.2

/** 纯滑动：同速质心直线（无转动），对比「只有平动」 */
export function buildRollingCompare(snap: ObserveSnapshot, _params?: ParamValues): CompareTrail {
  const R = Number(snap.values.R ?? 1)
  const v = Number(snap.values.v ?? 1)
  const T = Number(snap.values.tMax ?? 4)
  const path: number[][] = [
    [0, R],
    [v * T, R],
  ]
  return { path, label: '纯滑动质心' }
}

function createWheelMesh(radius: number): THREE.Group {
  const group = new THREE.Group()
  const disk = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.22, 32),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.2,
      roughness: 0.4,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.85,
    }),
  )
  disk.rotation.x = Math.PI / 2
  group.add(disk)

  const mark = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.12, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.35 }),
  )
  mark.position.set(0, -radius * 0.92, 0.12)
  group.add(mark)
  return group
}

export function createRollingAdapter(): DemoAdapter {
  let wheel: THREE.Group | null = null
  let trailCm: Line | null = null
  let trailRim: Line | null = null
  let ground: Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const R = Number(ctx.params.R ?? snap.values.R ?? 1)
      const x = Number(snap.values.x ?? 0)
      const tMax = Number(snap.values.tMax ?? 4)
      const v = Number(snap.values.v ?? 1)
      const xEnd = Math.max(x, v * tMax * 0.35, R * 4)
      drawRollingFrame(host, snap, rollingWorldBounds(R, xEnd), {
        compare: ctx.compare,
      })
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [4, 1.2, 0],
        yaw: 0.85,
        pitch: 0.42,
        distance: 18,
        distanceMin: 6,
        distanceMax: 48,
      })
      wheel = createWheelMesh(1)
      trailCm = createTrailLine(0x38bdf8)
      trailRim = createTrailLine(0xfbbf24)
      ground = new THREE.Mesh(
        new THREE.BoxGeometry(40, 0.08, 6),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 }),
      )
      ground.position.set(10, -0.04, 0)
      host.scene.add(wheel)
      host.scene.add(trailCm)
      host.scene.add(trailRim)
      host.scene.add(ground)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!wheel || !trailCm || !trailRim) return
      const R = Number(snap.values.R ?? 1)
      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      const y = R * VIS
      const theta = (Number(snap.values.theta ?? 0) * Math.PI) / 180
      wheel.scale.setScalar(R)
      wheel.position.set(x, y, 0)
      // 绕 z 旋转（屏幕内）；物理 θ 已为顺时针负向
      wheel.rotation.z = theta
      setTrailPositions(
        trailCm,
        (snap.trails?.path ?? []).map((p) => [p[0]! * VIS, p[1]! * VIS, 0]),
      )
      setTrailPositions(
        trailRim,
        (snap.trails?.rim ?? []).map((p) => [p[0]! * VIS, p[1]! * VIS, 0]),
      )
      host.render()
    },

    dispose3d() {
      wheel = null
      trailCm = null
      trailRim = null
      ground = null
    },

    buildCompare: buildRollingCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
