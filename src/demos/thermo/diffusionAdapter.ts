import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { diffusionWorldBounds, drawDiffusionFrame } from './renderDiffusion2d'

const MAX_MESH = 60

export function createDiffusionAdapter(): DemoAdapter {
  let dots: Mesh[] = []
  let ringTh: THREE.Line | null = null
  let ringMeas: THREE.Line | null = null
  let spoke: THREE.Line | null = null
  let origin: Mesh | null = null
  let labels: Object3D | null = null
  let lastR = -1

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawDiffusionFrame(host, snap, diffusionWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.45,
        pitch: 0.55,
        distance: 13,
        distanceMin: 5,
        distanceMax: 28,
      })
      const grid = new THREE.GridHelper(12, 12, 0x334155, 0x1e293b)
      grid.rotation.x = Math.PI / 2
      grid.position.z = -0.05
      host.scene.add(grid)

      origin = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.4 }),
      )
      host.scene.add(origin)

      dots = []
      for (let i = 0; i < MAX_MESH; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshStandardMaterial({ color: i === 0 ? 0xf472b6 : 0x38bdf8 }),
        )
        m.visible = false
        dots.push(m)
        host.scene.add(m)
      }

      const makeCircle = (color: number) => {
        const circle: THREE.Vector3[] = []
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * Math.PI * 2
          circle.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0))
        }
        return new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(circle),
          new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }),
        )
      }
      ringTh = makeCircle(0xfbbf24)
      ringMeas = makeCircle(0x38bdf8)
      host.scene.add(ringTh)
      host.scene.add(ringMeas)
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!ringTh || !ringMeas) return
      const N = Math.min(MAX_MESH, Number(snap.values.N ?? 0))
      const xs = snap.values.xs
      const ys = snap.values.ys
      const R = Math.sqrt(Math.max(0.05, Number(snap.values.r2Theory ?? 0)))
      const Rm = Math.sqrt(Math.max(0.05, Number(snap.values.r2 ?? 0)))
      ringTh.scale.setScalar(R)
      ringMeas.scale.setScalar(Rm)

      if (spoke) {
        host.scene.remove(spoke)
        spoke.geometry.dispose()
        ;(spoke.material as THREE.Material).dispose()
        spoke = null
      }
      if (xs instanceof Float32Array && ys instanceof Float32Array) {
        for (let i = 0; i < MAX_MESH; i++) {
          const m = dots[i]!
          if (i < N) {
            m.visible = true
            m.position.set(xs[i]!, ys[i]!, 0)
          } else m.visible = false
        }
        if (N > 0) {
          spoke = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(xs[0]!, ys[0]!, 0.02),
            ]),
            new THREE.LineDashedMaterial({ color: 0xf472b6, dashSize: 0.15, gapSize: 0.1 }),
          )
          spoke.computeLineDistances()
          host.scene.add(spoke)
        }
      }

      if (Math.abs(R - lastR) > 0.08) {
        if (labels) host.scene.remove(labels)
        labels = new THREE.Group()
        const lab = createTextSprite(`√(4Dt)=${R.toFixed(2)}`, { color: '#fbbf24', fontSize: 36, scale: 1.4 })
        lab.position.set(R * 0.7, R * 0.55, 0.1)
        labels.add(lab)
        host.scene.add(labels)
        lastR = R
      }
      host.render()
    },
    dispose3d() {
      dots = []
      ringTh = null
      ringMeas = null
      spoke = null
      origin = null
      labels = null
      lastR = -1
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
