import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { comptonWorldBounds, drawComptonFrame } from './renderCompton2d'

export function createComptonAdapter(): DemoAdapter {
  let electron: Mesh | null = null
  let photonIn: THREE.ArrowHelper | null = null
  let photonOut: THREE.ArrowHelper | null = null
  let recoil: THREE.ArrowHelper | null = null
  let angleArc: THREE.Line | null = null
  let labels: Object3D | null = null
  let lastTh = -999

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawComptonFrame(host, snap, comptonWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0.4, 0.2, 0],
        yaw: 0.5,
        pitch: 0.4,
        distance: 10,
        distanceMin: 4,
        distanceMax: 22,
      })
      const grid = new THREE.GridHelper(8, 8, 0x334155, 0x1e293b)
      grid.rotation.x = Math.PI / 2
      grid.position.z = -0.08
      host.scene.add(grid)
      electron = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.4 }),
      )
      host.scene.add(electron)
      photonIn = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-2.6, 0, 0), 2.3, 0x38bdf8, 0.2, 0.12)
      photonOut = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 2.3, 0xfbbf24, 0.2, 0.12)
      recoil = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1.2, 0xf472b6, 0.16, 0.1)
      host.scene.add(photonIn)
      host.scene.add(photonOut)
      host.scene.add(recoil)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!photonOut || !recoil) return
      const th = Number(snap.values.th ?? 0)
      const u = Number(snap.values.u ?? 0)
      const dLambda = Number(snap.values.dLambda ?? 0)
      const thetaDeg = Number(snap.values.theta ?? 0)
      photonOut.setDirection(new THREE.Vector3(Math.cos(th), Math.sin(th), 0))
      const eAng = -th * 0.45
      recoil.setDirection(new THREE.Vector3(Math.cos(eAng), Math.sin(eAng), 0))
      recoil.setLength(0.4 + 1.1 * Math.min(1, 0.3 + dLambda) * Math.max(0.2, u), 0.14, 0.09)

      if (Math.abs(th - lastTh) > 0.02) {
        if (angleArc) {
          host.scene.remove(angleArc)
          angleArc.geometry.dispose()
          ;(angleArc.material as THREE.Material).dispose()
        }
        const pts: THREE.Vector3[] = []
        const n = 24
        for (let i = 0; i <= n; i++) {
          const a = (th * i) / n
          pts.push(new THREE.Vector3(0.7 * Math.cos(a), 0.7 * Math.sin(a), 0.05))
        }
        angleArc = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0xa78bfa }),
        )
        host.scene.add(angleArc)

        if (labels) {
          host.scene.remove(labels)
          labels.traverse((c) => {
            const m = c as Mesh
            m.geometry?.dispose?.()
            ;(m.material as THREE.Material)?.dispose?.()
          })
        }
        labels = new THREE.Group()
        const tLab = createTextSprite(`θ=${thetaDeg.toFixed(0)}°`, { color: '#a78bfa', fontSize: 40 })
        tLab.position.set(1.1 * Math.cos(th / 2), 1.1 * Math.sin(th / 2), 0.2)
        labels.add(tLab)
        const dLab = createTextSprite(`Δλ=${dLambda.toFixed(2)}`, { color: '#fbbf24', fontSize: 36, scale: 1.3 })
        dLab.position.set(0, -1.6, 0.2)
        labels.add(dLab)
        const why = createTextSprite('光子失能→λ↑', { color: '#38bdf8', fontSize: 34, scale: 1.2 })
        why.position.set(-1.8, 1.4, 0.2)
        labels.add(why)
        const eLab = createTextSprite('反冲∝失能', { color: '#f472b6', fontSize: 32, scale: 1.1 })
        eLab.position.set(1.2, -1.2, 0.2)
        labels.add(eLab)
        host.scene.add(labels)
        lastTh = th
      }
      // hide/show based on playback stage
      if (photonIn) photonIn.visible = u < 0.55
      if (photonOut) photonOut.visible = u > 0.28
      if (recoil) recoil.visible = u > 0.28
      host.render()
    },
    dispose3d() {
      electron = null
      photonIn = null
      photonOut = null
      recoil = null
      angleArc = null
      labels = null
      lastTh = -999
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
