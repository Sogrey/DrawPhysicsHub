import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { alphaWorldBounds, drawAlphaFrame } from './renderAlpha2d'

export function createAlphaAdapter(): DemoAdapter {
  let nucleus: Mesh | null = null
  let particle: Mesh | null = null
  let trail: THREE.Line | null = null
  let impact: THREE.Line | null = null
  let bLine: THREE.Line | null = null
  let labels: Object3D | null = null
  let lastKey = ''

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawAlphaFrame(host, snap, alphaWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.6,
        pitch: 0.5,
        distance: 18,
        distanceMin: 8,
        distanceMax: 40,
      })
      const grid = new THREE.GridHelper(18, 18, 0x334155, 0x1e293b)
      grid.rotation.x = Math.PI / 2
      grid.position.z = -0.08
      host.scene.add(grid)
      nucleus = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0x92400e,
          emissiveIntensity: 0.45,
        }),
      )
      particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.3 }),
      )
      host.scene.add(nucleus)
      host.scene.add(particle)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!particle) return
      const b = Number(snap.values.b ?? 1.2)
      const key = `${snap.values.b}|${snap.values.v0}|${snap.values.soft}`
      if (key !== lastKey) {
        if (trail) {
          host.scene.remove(trail)
          trail.geometry.dispose()
          ;(trail.material as THREE.Material).dispose()
          trail = null
        }
        if (impact) {
          host.scene.remove(impact)
          impact.geometry.dispose()
          ;(impact.material as THREE.Material).dispose()
          impact = null
        }
        if (bLine) {
          host.scene.remove(bLine)
          bLine.geometry.dispose()
          ;(bLine.material as THREE.Material).dispose()
          bLine = null
        }
        if (labels) {
          host.scene.remove(labels)
          labels.traverse((c) => {
            const m = c as Mesh
            m.geometry?.dispose?.()
            ;(m.material as THREE.Material)?.dispose?.()
          })
          labels = null
        }

        const xs = snap.values.xs
        const ys = snap.values.ys
        const n = Number(snap.values.n ?? 0)
        if (xs instanceof Float32Array && ys instanceof Float32Array && n > 2) {
          const pts: THREE.Vector3[] = []
          for (let i = 0; i < n; i++) pts.push(new THREE.Vector3(xs[i]!, ys[i]!, 0))
          trail = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
          )
          host.scene.add(trail)
        }

        impact = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-9, b, 0.02),
            new THREE.Vector3(-0.4, b, 0.02),
          ]),
          new THREE.LineDashedMaterial({ color: 0xa78bfa, dashSize: 0.25, gapSize: 0.15 }),
        )
        impact.computeLineDistances()
        host.scene.add(impact)

        bLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-7, 0, 0.02),
            new THREE.Vector3(-7, b, 0.02),
          ]),
          new THREE.LineBasicMaterial({ color: 0xa78bfa }),
        )
        host.scene.add(bLine)

        labels = new THREE.Group()
        const bLab = createTextSprite(`b=${b.toFixed(2)}`, { color: '#a78bfa', fontSize: 40 })
        bLab.position.set(-7.8, b / 2, 0.2)
        labels.add(bLab)
        const thLab = createTextSprite(`θ≈${Number(snap.values.thetaDeg ?? 0).toFixed(0)}°`, {
          color: '#f472b6',
          fontSize: 38,
        })
        thLab.position.set(3.5, b * 0.6 + 1, 0.2)
        labels.add(thLab)
        const nLab = createTextSprite('核', { color: '#fbbf24', fontSize: 36, scale: 1.1 })
        nLab.position.set(0.5, -0.6, 0.2)
        labels.add(nLab)
        host.scene.add(labels)
        lastKey = key
      }
      particle.position.set(Number(snap.values.x ?? 0), Number(snap.values.y ?? 0), 0.05)
      host.render()
    },
    dispose3d() {
      nucleus = null
      particle = null
      trail = null
      impact = null
      bLine = null
      labels = null
      lastKey = ''
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
