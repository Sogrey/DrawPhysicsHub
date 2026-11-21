import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import type { Mesh } from 'three'
import * as THREE from 'three'
import { drawThinFilmFrame, thinFilmWorldBounds } from './renderThinFilm2d'

export function createThinFilmAdapter(): DemoAdapter {
  let film: Mesh | null = null
  let glow: Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _ctx: DemoAdapterContext) {
      drawThinFilmFrame(host, snap, thinFilmWorldBounds())
    },

    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, 0.2, 0],
        yaw: 0.55,
        pitch: 0.45,
        distance: 9,
        distanceMin: 4,
        distanceMax: 20,
      })

      film = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.35, 3),
        new THREE.MeshStandardMaterial({
          color: 0xa78bfa,
          transparent: true,
          opacity: 0.45,
          metalness: 0.2,
          roughness: 0.35,
        }),
      )
      film.position.set(0, 0, 0)

      glow = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 3.2),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        }),
      )
      glow.rotation.x = -Math.PI / 2
      glow.position.set(0, 0.22, 0)

      host.scene.add(film)
      host.scene.add(glow)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot) {
      if (!film || !glow) return
      const d = Number(snap.values.d ?? 0.3)
      const I = Number(snap.values.I ?? 0)
      film.scale.set(1, 0.4 + d * 1.2, 1)
      ;(glow.material as THREE.MeshBasicMaterial).opacity = 0.08 + 0.55 * I
      const hue = 0.55 + 0.15 * Math.sin(I * Math.PI)
      ;(glow.material as THREE.MeshBasicMaterial).color.setHSL(hue, 0.7, 0.45 + 0.25 * I)
      host.render()
    },

    dispose3d() {
      film = null
      glow = null
    },

    dispose() {
      this.dispose3d?.()
    },
  }
}
