import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawWellFrame, wellWorldBounds } from './renderWell2d'

const AMP = 1.8

export function createWellAdapter(): DemoAdapter {
  let walls: Object3D | null = null
  let psiLine: THREE.Line | null = null
  let complexLine: THREE.Line | null = null
  let densMesh: Mesh | null = null
  let floorGuide: THREE.Line | null = null
  let labels: THREE.Group | null = null
  let phaseRing: THREE.Group | null = null
  let lastKey = ''

  function clearObj(host: ThreeHost, obj: THREE.Object3D | null) {
    if (!obj) return
    host.scene.remove(obj)
    obj.traverse((c) => {
      const m = c as Mesh
      m.geometry?.dispose?.()
      const mat = (c as THREE.Line).material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
      else mat?.dispose?.()
    })
  }

  function rebuild(host: ThreeHost, snap: ObserveSnapshot) {
    clearObj(host, psiLine)
    clearObj(host, complexLine)
    clearObj(host, densMesh)
    clearObj(host, floorGuide)
    psiLine = null
    complexLine = null
    densMesh = null
    floorGuide = null

    const L = Number(snap.values.L ?? 4)
    const psi = snap.values.psi
    const dens = snap.values.dens
    const re = snap.values.re
    const im = snap.values.im
    const nSamp = Number(snap.values.nSamp ?? 120)
    if (!(psi instanceof Float32Array) || !(dens instanceof Float32Array)) return
    if (!(re instanceof Float32Array) || !(im instanceof Float32Array)) return

    // 包络：x–Re 平面内的静止 ψₙ（z=0）
    const psiPts: THREE.Vector3[] = []
    for (let i = 0; i < nSamp; i++) {
      const x = (L * i) / Math.max(1, nSamp - 1)
      psiPts.push(new THREE.Vector3(x, psi[i]! * AMP, 0))
    }
    psiLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(psiPts),
      new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.1,
        gapSize: 0.07,
        transparent: true,
        opacity: 0.85,
      }),
    )
    psiLine.computeLineDistances()
    host.scene.add(psiLine)

    // 复波函数曲线：点 (x, Re, Im) —— 位相转动时整条曲线在 Re–Im 平面内旋转
    const cplx: THREE.Vector3[] = []
    for (let i = 0; i < nSamp; i++) {
      const x = (L * i) / Math.max(1, nSamp - 1)
      cplx.push(new THREE.Vector3(x, re[i]! * AMP, im[i]! * AMP))
    }
    complexLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(cplx),
      new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
    )
    host.scene.add(complexLine)

    // |ψ|²：放在 z≈−1.2 的竖直剖面上，避免与 Im(+z) 抢轴
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    for (let i = 0; i < nSamp; i++) {
      const x = (L * i) / Math.max(1, nSamp - 1)
      shape.lineTo(x, dens[i]! * 2.4)
    }
    shape.lineTo(L, 0)
    shape.closePath()
    densMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: 0xa78bfa,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      }),
    )
    densMesh.position.z = -1.15
    host.scene.add(densMesh)

    // 阱底 x 轴参考
    floorGuide = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.01, 0),
        new THREE.Vector3(L, 0.01, 0),
      ]),
      new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.7 }),
    )
    host.scene.add(floorGuide)
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const L = Number(snap.values.L ?? 4)
      drawWellFrame(host, snap, wellWorldBounds(L))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [2, 0.2, 0],
        yaw: 0.7,
        pitch: 0.38,
        distance: 11,
        distanceMin: 5,
        distanceMax: 24,
      })

      walls = new THREE.Group()
      const mat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.5,
      })
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 2.4), mat)
      const right = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 2.4), mat)
      left.position.set(0, 0.6, 0)
      right.position.set(4, 0.6, 0)
      walls.add(left, right)

      // Re / Im 轴小标记（阱中央）
      const axisRe = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(2, 0, 0),
        1.4,
        0xfbbf24,
        0.18,
        0.1,
      )
      const axisIm = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(2, 0, 0),
        1.4,
        0x34d399,
        0.18,
        0.1,
      )
      walls.add(axisRe, axisIm)

      labels = new THREE.Group()
      const lInfL = createTextSprite('V=∞', { color: '#cbd5e1', scale: 1.0 })
      lInfL.position.set(-0.4, 1.8, 0)
      const lInfR = createTextSprite('V=∞', { color: '#cbd5e1', scale: 1.0 })
      lInfR.position.set(4.4, 1.8, 0)
      const lRe = createTextSprite('Re', { color: '#fbbf24', scale: 0.85 })
      lRe.position.set(2.15, 1.55, 0)
      const lIm = createTextSprite('Im', { color: '#34d399', scale: 0.85 })
      lIm.position.set(2.15, 0.15, 1.55)
      const lPsi = createTextSprite('ψₙ(x)', { color: '#38bdf8', scale: 0.9 })
      lPsi.position.set(2.2, 1.1, -0.3)
      const lDens = createTextSprite('|ψ|²', { color: '#c4b5fd', scale: 0.9 })
      lDens.position.set(2.2, 0.9, -1.35)
      const lCplx = createTextSprite('ψ(x,t)', { color: '#fbbf24', scale: 1.0 })
      lCplx.position.set(2.2, 0.95, 0.85)
      labels.add(lInfL, lInfR, lRe, lIm, lPsi, lDens, lCplx)

      phaseRing = new THREE.Group()
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.028, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.55 }),
      )
      // 位相钟立在 Re–Im 平面（YZ）
      ring.rotation.y = Math.PI / 2
      const hand = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        0.4,
        0xfbbf24,
        0.1,
        0.06,
      )
      phaseRing.add(ring, hand)
      phaseRing.position.set(-1.1, 1.1, 0)
      const lPhi = createTextSprite('φ', { color: '#fbbf24', scale: 0.8 })
      lPhi.position.set(0, 0.55, 0)
      phaseRing.add(lPhi)

      host.scene.add(walls)
      host.scene.add(labels)
      host.scene.add(phaseRing)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      const L = Number(snap.values.L ?? 4)
      const n = Number(snap.values.n ?? 1)
      const phase = Number(snap.values.phase ?? 0)
      if (walls) {
        const right = walls.children[1] as Mesh
        if (right) right.position.x = L
        // Re/Im 轴跟到阱中
        const mid = L / 2
        const axisRe = walls.children[2] as THREE.ArrowHelper
        const axisIm = walls.children[3] as THREE.ArrowHelper
        if (axisRe) axisRe.position.set(mid, 0, 0)
        if (axisIm) axisIm.position.set(mid, 0, 0)
        if (labels) {
          if (labels.children[1]) labels.children[1]!.position.x = L + 0.4
          for (let i = 2; i < labels.children.length; i++) {
            if (labels.children[i]) labels.children[i]!.position.x = mid + 0.2
          }
        }
      }
      if (phaseRing) {
        const hand = phaseRing.children[1] as THREE.ArrowHelper
        if (hand) {
          // φ：Re=cosφ → +Y，Im=−sinφ → −Z（与 e^{-iφ} 一致）
          hand.setDirection(
            new THREE.Vector3(0, Math.cos(phase), -Math.sin(phase)).normalize(),
          )
        }
      }
      const key = `${n}|${L.toFixed(2)}|${phase.toFixed(2)}`
      if (key !== lastKey) {
        rebuild(host, snap)
        lastKey = key
      }
      host.render()
    },

    dispose3d() {
      walls = null
      psiLine = null
      complexLine = null
      densMesh = null
      floorGuide = null
      labels = null
      phaseRing = null
      lastKey = ''
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
