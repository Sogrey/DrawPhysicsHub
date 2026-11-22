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
import type { Mesh } from 'three'
import * as THREE from 'three'
import { coriolisWorldBounds, drawCoriolisFrame } from './renderCoriolis2d'

const VIS = 1.35

/** 物理 (x,y)、Ω∥z → Three Y-up：(x,y)→(x,z)，Ω→+Y */

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
  let turntable: THREE.Group | null = null
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
      // 俯视水平转盘（盘在 XZ，Ω∥Y）
      host.setViewDefaults({
        lookAt: [0, 0, 0],
        yaw: 0.55,
        pitch: 0.95,
        distance: 12,
        distanceMin: 5,
        distanceMax: 28,
      })

      turntable = new THREE.Group()

      // Cylinder 默认轴∥Y → 圆面就在 XZ（地面），无需再倾倒
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
      disk.position.y = 0.05
      turntable.add(disk)

      for (let k = 0; k < 8; k++) {
        const th = (k * Math.PI) / 4
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0.12, 0),
          new THREE.Vector3(3.05 * VIS * Math.cos(th), 0.12, 3.05 * VIS * Math.sin(th)),
        ])
        turntable.add(
          new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 }),
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
      cArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(), 1.4, 0xf472b6, 0.28, 0.16)
      fArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1.2, 0x38bdf8, 0.24, 0.14)
      // Ω 竖直向上（对应 2D 出纸面）
      omegaArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        2.6,
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

      host.scene.add(turntable)
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
      const px = ctx.live.x ?? Number(snap.values.x ?? 0)
      const py = ctx.live.y ?? Number(snap.values.y ?? 0)
      const vx = Number(snap.values.vx ?? 0)
      const vy = Number(snap.values.vy ?? 0)
      const acx = Number(snap.values.acx ?? 0)
      const acy = Number(snap.values.acy ?? 0)
      const afx = Number(snap.values.afx ?? 0)
      const afy = Number(snap.values.afy ?? 0)
      const Omega = Number(snap.values.Omega ?? 0.9)
      const t = Number(snap.time ?? 0)
      const withCf = Number(snap.values.withCf ?? 0) > 0.5

      // 物理 (x,y) → 场景 (x, z)；高度 y 固定在盘面之上
      const X = px * VIS
      const Z = py * VIS
      probe.position.set(X, 0.28, Z)

      // 盘 + 辐条同一 Group，只绕 Y 转 → 始终共面
      if (turntable) turntable.rotation.y = Omega * t

      const path = snap.trails?.path
      if (path?.length) {
        setTrailPositions(
          trailLine,
          path.map((p) => [p[0]! * VIS, 0.2, p[1]! * VIS]),
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

      const rLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0.18, 0),
          new THREE.Vector3(X, 0.18, Z),
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
      vArrow.position.set(X, 0.32, Z)
      if (sp > 0.05) {
        const len = Math.min(2.4, 0.7 + 0.35 * sp)
        // 物理 v=(vx,vy) → 场景 (vx, 0, vy)
        vArrow.visible = true
        vArrow.setDirection(new THREE.Vector3(vx / sp, 0, vy / sp))
        vArrow.setLength(len, 0.28, 0.16)
        if (lblV) {
          lblV.visible = true
          lblV.position.set(X + (vx / sp) * (len + 0.35), 0.55, Z + (vy / sp) * (len + 0.35))
        }
      } else {
        vArrow.visible = false
        if (lblV) lblV.visible = false
      }

      const acm = Math.hypot(acx, acy)
      cArrow.position.set(X, 0.36, Z)
      if (acm > 0.05) {
        const len = Math.min(2.5, 0.65 + 0.3 * acm)
        cArrow.visible = true
        cArrow.setDirection(new THREE.Vector3(acx / acm, 0, acy / acm))
        cArrow.setLength(len, 0.28, 0.16)
        if (lblC) {
          lblC.visible = true
          lblC.position.set(X + (acx / acm) * (len + 0.4), 0.6, Z + (acy / acm) * (len + 0.4))
        }
        if (sp > 0.05) {
          const s = 0.55
          const ux = vx / sp
          const uz = vy / sp
          const cxu = acx / acm
          const czu = acy / acm
          guides.add(
            new THREE.Line(
              new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(X + ux * s, 0.38, Z + uz * s),
                new THREE.Vector3(X + ux * s + cxu * s, 0.38, Z + uz * s + czu * s),
                new THREE.Vector3(X + cxu * s, 0.38, Z + czu * s),
              ]),
              new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
            ),
          )
        }
      } else {
        cArrow.visible = false
        if (lblC) lblC.visible = false
      }

      const afm = Math.hypot(afx, afy)
      fArrow.position.set(X, 0.3, Z)
      if (withCf && afm > 0.05) {
        const len = Math.min(2.1, 0.55 + 0.25 * afm)
        fArrow.visible = true
        fArrow.setDirection(new THREE.Vector3(afx / afm, 0, afy / afm))
        fArrow.setLength(len, 0.24, 0.14)
        if (lblF) {
          lblF.visible = true
          lblF.position.set(X + (afx / afm) * (len + 0.35), 0.5, Z + (afy / afm) * (len + 0.35))
        }
      } else {
        fArrow.visible = false
        if (lblF) lblF.visible = false
      }

      const oy = Omega >= 0 ? 1 : -1
      omegaArrow.setDirection(new THREE.Vector3(0, oy, 0))
      omegaArrow.position.set(0, Omega >= 0 ? 0.1 : 2.7, 0)
      omegaArrow.setLength(2.6, 0.32, 0.18)
      if (lblO) lblO.position.set(0.4, Omega >= 0 ? 2.85 : 0.15, 0.4)

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
      turntable = null
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
