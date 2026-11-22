import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawWellFrame, wellWorldBounds } from './renderWell2d'

export function createWellAdapter(): DemoAdapter {
  let walls: Object3D | null = null
  let psiLine: THREE.Line | null = null
  let reLine: THREE.Line | null = null
  let densMesh: Mesh | null = null
  let labels: THREE.Group | null = null
  let phaseRing: THREE.Group | null = null
  let lastKey = ''

  function clearCurve(host: ThreeHost, obj: THREE.Object3D | null) {
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
    clearCurve(host, psiLine)
    clearCurve(host, reLine)
    clearCurve(host, densMesh)
    psiLine = null
    reLine = null
    densMesh = null

    const L = Number(snap.values.L ?? 4)
    const psi = snap.values.psi
    const dens = snap.values.dens
    const re = snap.values.re
    const nSamp = Number(snap.values.nSamp ?? 120)
    if (!(psi instanceof Float32Array) || !(dens instanceof Float32Array)) return

    const psiPts: THREE.Vector3[] = []
    for (let i = 0; i < nSamp; i++) {
      const x = (L * i) / Math.max(1, nSamp - 1)
      psiPts.push(new THREE.Vector3(x, psi[i]! * 1.6, 0))
    }
    psiLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(psiPts),
      new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 0.12,
        gapSize: 0.08,
      }),
    )
    psiLine.computeLineDistances()
    host.scene.add(psiLine)

    if (re instanceof Float32Array) {
      const rePts: THREE.Vector3[] = []
      for (let i = 0; i < nSamp; i++) {
        const x = (L * i) / Math.max(1, nSamp - 1)
        rePts.push(new THREE.Vector3(x, re[i]! * 1.6, 0.05))
      }
      reLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(rePts),
        new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
      )
      host.scene.add(reLine)
    }

    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    for (let i = 0; i < nSamp; i++) {
      const x = (L * i) / Math.max(1, nSamp - 1)
      shape.lineTo(x, dens[i]! * 2.2)
    }
    shape.lineTo(L, 0)
    shape.closePath()
    densMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: 0xa78bfa,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
      }),
    )
    densMesh.position.z = -0.06
    host.scene.add(densMesh)
  }

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      const L = Number(snap.values.L ?? 4)
      drawWellFrame(host, snap, wellWorldBounds(L))
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [2, 0.35, 0],
        yaw: 0.45,
        pitch: 0.42,
        distance: 10,
        distanceMin: 5,
        distanceMax: 22,
      })
      walls = new THREE.Group()
      const mat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.55,
      })
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.4, 1.3), mat)
      const right = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.4, 1.3), mat)
      left.position.set(0, 0.35, 0)
      right.position.set(4, 0.35, 0)
      walls.add(left, right)

      labels = new THREE.Group()
      const lInfL = createTextSprite('V=∞', { color: '#cbd5e1', scale: 1.0 })
      lInfL.position.set(-0.35, 1.7, 0.6)
      const lInfR = createTextSprite('V=∞', { color: '#cbd5e1', scale: 1.0 })
      lInfR.position.set(4.35, 1.7, 0.6)
      const lPsi = createTextSprite('ψₙ', { color: '#38bdf8', scale: 0.95 })
      lPsi.position.set(2.1, 1.1, 0.4)
      const lDens = createTextSprite('|ψ|²', { color: '#c4b5fd', scale: 0.95 })
      lDens.position.set(2.1, 0.55, -0.2)
      const lRe = createTextSprite('Reψ(t)', { color: '#fbbf24', scale: 1.0 })
      lRe.position.set(2.1, -0.55, 0.5)
      labels.add(lInfL, lInfR, lPsi, lDens, lRe)

      phaseRing = new THREE.Group()
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.03, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.55 }),
      )
      ring.rotation.x = Math.PI / 2
      const hand = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        0.45,
        0xfbbf24,
        0.1,
        0.06,
      )
      phaseRing.add(ring, hand)
      phaseRing.position.set(-0.9, 1.2, 0.8)
      const lPhi = createTextSprite('φ', { color: '#fbbf24', scale: 0.85 })
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
        if (labels) {
          const lInfR = labels.children[1]
          if (lInfR) lInfR.position.x = L + 0.35
          const mid = L / 2
          if (labels.children[2]) labels.children[2]!.position.x = mid + 0.2
          if (labels.children[3]) labels.children[3]!.position.x = mid + 0.2
          if (labels.children[4]) labels.children[4]!.position.x = mid + 0.2
        }
      }
      if (phaseRing) {
        const hand = phaseRing.children[1] as THREE.ArrowHelper
        if (hand) {
          hand.setDirection(new THREE.Vector3(Math.cos(phase), 0, -Math.sin(phase)))
        }
      }
      // dens 不随时变；re/ψ 随 n,L,phase
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
      reLine = null
      densMesh = null
      labels = null
      phaseRing = null
      lastKey = ''
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
