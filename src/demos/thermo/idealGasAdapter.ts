import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { drawIdealGasFrame, idealGasWorldBounds } from './renderIdealGas2d'

const MAX_DOT = 36

export function createIdealGasAdapter(): DemoAdapter {
  let box: Mesh | null = null
  let wall: Mesh | null = null
  let dots: Mesh[] = []
  let arrows: THREE.ArrowHelper[] = []
  let labels: Object3D | null = null
  let lastKey = ''

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawIdealGasFrame(host, snap, idealGasWorldBounds())
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.65,
        pitch: 0.4,
        distance: 11,
        distanceMin: 4,
        distanceMax: 24,
      })
      box = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.22,
          wireframe: true,
        }),
      )
      wall = new THREE.Mesh(
        new THREE.PlaneGeometry(0.06, 1),
        new THREE.MeshStandardMaterial({
          color: 0xf472b6,
          emissive: 0x9d174d,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        }),
      )
      host.scene.add(box)
      host.scene.add(wall)
      dots = []
      for (let i = 0; i < MAX_DOT; i++) {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x92400e, emissiveIntensity: 0.3 }),
        )
        m.visible = false
        dots.push(m)
        host.scene.add(m)
      }
      arrows = []
      for (let i = 0; i < 7; i++) {
        const a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.6, 0xf472b6, 0.12, 0.08)
        a.visible = false
        arrows.push(a)
        host.scene.add(a)
      }
    },
    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!box || !wall) return
      const s = Number(snap.values.side ?? 1)
      const P = Number(snap.values.P ?? 1)
      const T = Number(snap.values.T ?? 2)
      const n = Number(snap.values.n ?? 1)
      const V = Number(snap.values.V ?? 2)
      box.scale.set(s, s, s * 0.55)
      wall.position.set(s / 2, 0, 0)
      wall.scale.set(1, s, 1)

      const px = snap.values.px
      const py = snap.values.py
      const nDots = Number(snap.values.nDots ?? 0)
      const wallPulse = Number(snap.values.wallPulse ?? 0.5)
      const t = Number(snap.time ?? 0)
      for (let i = 0; i < MAX_DOT; i++) {
        const m = dots[i]!
        if (px instanceof Float32Array && py instanceof Float32Array && i < nDots) {
          m.visible = true
          const z = Math.sin(t * (1.5 + Math.sqrt(T)) + i * 0.7) * s * 0.18
          m.position.set(px[i]!, py[i]!, z)
          m.scale.setScalar(0.8 + T * 0.15)
        } else m.visible = false
      }

      const nArr = Math.min(arrows.length, Math.max(2, Math.round(1 + P * 2.2)))
      const arrowLen = (0.35 + P * 0.25) * (1 + 0.1 * wallPulse)
      for (let i = 0; i < arrows.length; i++) {
        const a = arrows[i]!
        if (i < nArr) {
          a.visible = true
          const y = -s / 2 + ((i + 0.5) * s) / nArr
          a.position.set(s / 2, y, 0)
          a.setLength(arrowLen, 0.12, 0.08)
        } else a.visible = false
      }
      ;(wall.material as THREE.MeshStandardMaterial).opacity = 0.45 + 0.5 * wallPulse

      const key = `${s.toFixed(2)}|${P.toFixed(2)}|${T.toFixed(2)}`
      if (key !== lastKey) {
        if (labels) {
          host.scene.remove(labels)
          labels.traverse((c) => {
            const m = c as Mesh
            m.geometry?.dispose?.()
            ;(m.material as THREE.Material)?.dispose?.()
          })
        }
        labels = new THREE.Group()
        labels.add(createTextSprite(`V=${V.toFixed(2)}`, { color: '#fbbf24', fontSize: 42 }))
        labels.children[0]!.position.set(0, s / 2 + 0.35, 0)
        const pLab = createTextSprite(`P=${P.toFixed(2)}`, { color: '#f472b6', fontSize: 40 })
        pLab.position.set(s / 2 + arrowLen + 0.35, 0, 0)
        labels.add(pLab)
        const tLab = createTextSprite(`T=${T.toFixed(2)}`, { color: '#38bdf8', fontSize: 40 })
        tLab.position.set(0, -s / 2 - 0.4, 0)
        labels.add(tLab)
        host.scene.add(labels)
        lastKey = key
      }
      host.render()
    },
    dispose3d() {
      box = null
      wall = null
      dots = []
      arrows = []
      labels = null
      lastKey = ''
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
