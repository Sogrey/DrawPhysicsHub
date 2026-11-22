import type {
  CompareTrail,
  DemoAdapter,
  DemoAdapterContext,
} from '@/core/physics/adapter'
import type { ObserveSnapshot, ParamValues } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { createParticleMesh, setTrailPositions } from '@/core/render/particle3d'
import { createTextSprite } from '@/core/render/primitives3d'
import type { Mesh, Object3D } from 'three'
import * as THREE from 'three'
import { coriolisWorldBounds, drawCoriolisFrame } from './renderCoriolis2d'

const VIS = 1.35

export function buildCoriolisCompare(
  snap: ObserveSnapshot,
  _params?: ParamValues,
): CompareTrail {
  const v0 = Number(snap.values.v0 ?? 1.6)
  return {
    path: [
      [0, 0],
      [Math.min(3.0, v0 * 1.4), 0],
    ],
    label: '初速方向',
  }
}

export function createCoriolisAdapter(): DemoAdapter {
  let probe: Mesh | null = null
  let disk: Mesh | null = null
  let trailLine: THREE.Line | null = null
  let vArrow: THREE.ArrowHelper | null = null
  let cArrow: THREE.ArrowHelper | null = null
  let fArrow: THREE.ArrowHelper | null = null
  let omegaArrow: THREE.ArrowHelper | null = null
  let spokes: Object3D | null = null
  let guides: THREE.Group | null = null
  let labels: THREE.Group | null = null
  let lblV: THREE.Sprite | null = null
  let lblC: THREE.Sprite | null = null
  let lblF: THREE.Sprite | null = null
  let lblO: THREE.Sprite | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      const world = Number(snap.values.world ?? 4.2)
      drawCoriolisFrame(host, snap, coriolisWorldBounds(world), { compare: ctx.compare })
    },

    setup3d(host: ThreeHost) {
      // 偏俯视，突出 xy 平面上的 ⊥ 关系；绿竖箭 = Ω
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.35,
        pitch: 1.05,
        distance: 11,
        distanceMin: 5,
        distanceMax: 26,
      })

      disk = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2 * VIS, 3.2 * VIS, 0.1, 48),
        new THREE.MeshStandardMaterial({
          color: 0x475569,
          transparent: true,
          opacity: 0.5,
          metalness: 0.15,
          roughness: 0.75,
        }),
      )
      disk.rotation.x = Math.PI / 2

      spokes = new THREE.Group()
      for (let k = 0; k < 8; k++) {
        const th = (k * Math.PI) / 4
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0.08),
          new THREE.Vector3(3.05 * VIS * Math.cos(th), 3.05 * VIS * Math.sin(th), 0.08),
        ])
        spokes.add(
          new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.55 }),
          ),
        )
      }

      probe = createParticleMesh({
        radius: 0.2,
        color: 0xfbbf24,
        emissive: 0x92400e,
      })
      trailLine = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
      )
      vArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1.4, 0x4ade80, 0.28, 0.16)
      cArrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1.4, 0xf472b6, 0.28, 0.16)
      fArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1.2, 0x38bdf8, 0.24, 0.14)
      omegaArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        2.4,
        0x94a3b8,
        0.32,
        0.18,
      )

      guides = new THREE.Group()
      labels = new THREE.Group()
      lblV = createTextSprite('v', { color: '#4ade80', scale: 1.1 })
      lblC = createTextSprite('a_cor', { color: '#f472b6', scale: 1.15 })
      lblF = createTextSprite('a_cf', { color: '#38bdf8', scale: 1.05 })
      lblO = createTextSprite('Ω', { color: '#cbd5e1', scale: 1.2 })
      labels.add(lblV, lblC, lblF, lblO)

      host.scene.add(disk)
      host.scene.add(spokes)
      host.scene.add(probe)
      host.scene.add(trailLine)
      host.scene.add(vArrow)
      host.scene.add(cArrow)
      host.scene.add(fArrow)
      host.scene.add(omegaArrow)
      host.scene.add(guides)
      host.scene.add(labels)
    },

    paint3d(host: ThreeHost, snap: ObserveSnapshot, ctx: DemoAdapterContext) {
      if (!probe || !vArrow || !cArrow || !fArrow || !omegaArrow || !trailLine || !guides) return
      const x = (ctx.live.x ?? Number(snap.values.x ?? 0)) * VIS
      const y = (ctx.live.y ?? Number(snap.values.y ?? 0)) * VIS
      const vx = Number(snap.values.vx ?? 0)
      const vy = Number(snap.values.vy ?? 0)
      const acx = Number(snap.values.acx ?? 0)
      const acy = Number(snap.values.acy ?? 0)
      const afx = Number(snap.values.afx ?? 0)
      const afy = Number(snap.values.afy ?? 0)
      const Omega = Number(snap.values.Omega ?? 0.9)
      const t = Number(snap.time ?? 0)
      const withCf = Number(snap.values.withCf ?? 0) > 0.5

      probe.position.set(x, y, 0.22)
      if (disk) disk.rotation.z = Omega * t
      if (spokes) spokes.rotation.z = Omega * t

      const path = snap.trails?.path
      if (path?.length) {
        setTrailPositions(
          trailLine,
          path.map((p) => [p[0]! * VIS, p[1]! * VIS, 0.16]),
        )
      }

      while (guides.children.length) {
        const c = guides.children.pop()!
        guides.remove(c)
        const g = (c as THREE.Line).geometry
        g?.dispose?.()
        const mat = (c as THREE.Line).material as THREE.Material | undefined
        mat?.dispose?.()
      }

      // 半径虚线
      const rLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0.12),
          new THREE.Vector3(x, y, 0.12),
        ]),
        new THREE.LineDashedMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.45,
          dashSize: 0.18,
          gapSize: 0.12,
        }),
      )
      rLine.computeLineDistances()
      guides.add(rLine)

      const sp = Math.hypot(vx, vy)
      vArrow.position.set(x, y, 0.28)
      if (sp > 0.05) {
        const len = Math.min(2.4, 0.7 + 0.35 * sp)
        vArrow.visible = true
        vArrow.setDirection(new THREE.Vector3(vx / sp, vy / sp, 0))
        vArrow.setLength(len, 0.28, 0.16)
        if (lblV) {
          lblV.visible = true
          lblV.position.set(x + (vx / sp) * (len + 0.35), y + (vy / sp) * (len + 0.35), 0.55)
        }
      } else {
        vArrow.visible = false
        if (lblV) lblV.visible = false
      }

      const acm = Math.hypot(acx, acy)
      cArrow.position.set(x, y, 0.32)
      if (acm > 0.05) {
        const len = Math.min(2.5, 0.65 + 0.3 * acm)
        cArrow.visible = true
        cArrow.setDirection(new THREE.Vector3(acx / acm, acy / acm, 0))
        cArrow.setLength(len, 0.28, 0.16)
        if (lblC) {
          lblC.visible = true
          lblC.position.set(x + (acx / acm) * (len + 0.4), y + (acy / acm) * (len + 0.4), 0.6)
        }
        // ⊥ 直角折线
        if (sp > 0.05) {
          const s = 0.55
          const ux = vx / sp
          const uy = vy / sp
          const cxu = acx / acm
          const cyu = acy / acm
          const elbow = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(x + ux * s, y + uy * s, 0.35),
              new THREE.Vector3(x + ux * s + cxu * s, y + uy * s + cyu * s, 0.35),
              new THREE.Vector3(x + cxu * s, y + cyu * s, 0.35),
            ]),
            new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
          )
          guides.add(elbow)
        }
      } else {
        cArrow.visible = false
        if (lblC) lblC.visible = false
      }

      const afm = Math.hypot(afx, afy)
      fArrow.position.set(x, y, 0.25)
      if (withCf && afm > 0.05) {
        const len = Math.min(2.1, 0.55 + 0.25 * afm)
        fArrow.visible = true
        fArrow.setDirection(new THREE.Vector3(afx / afm, afy / afm, 0))
        fArrow.setLength(len, 0.24, 0.14)
        if (lblF) {
          lblF.visible = true
          lblF.position.set(x + (afx / afm) * (len + 0.35), y + (afy / afm) * (len + 0.35), 0.5)
        }
      } else {
        fArrow.visible = false
        if (lblF) lblF.visible = false
      }

      const oz = Omega >= 0 ? 1 : -1
      omegaArrow.setDirection(new THREE.Vector3(0, 0, oz))
      omegaArrow.position.set(0, 0, Omega >= 0 ? 0 : 2.4)
      omegaArrow.setLength(2.4, 0.32, 0.18)
      if (lblO) lblO.position.set(0.35, 0.35, Omega >= 0 ? 2.6 : -0.2)

      host.render()
    },

    dispose3d() {
      probe = null
      disk = null
      trailLine = null
      vArrow = null
      cArrow = null
      fArrow = null
      omegaArrow = null
      spokes = null
      guides = null
      labels = null
      lblV = null
      lblC = null
      lblF = null
      lblO = null
    },

    buildCompare: buildCoriolisCompare,

    dispose() {
      this.dispose3d?.()
    },
  }
}
