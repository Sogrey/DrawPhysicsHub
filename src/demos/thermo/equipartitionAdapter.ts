import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createEquipartitionAdapter(): DemoAdapter {
  const bars3d: THREE.Mesh[] = []
  const dofSpheres: THREE.Mesh[] = []

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: 2, xMax: 8, yMin: -0.4, yMax: 9 }, W, H)
      const path = snap.trails?.path
      const fNow = Number(snap.values.f ?? 5)
      const lit = Number(snap.values.lit ?? 0)
      const blend = Number(snap.values.blend ?? 0)
      if (path) {
        for (const p of path) {
          const f = p[0]!
          const Cv = p[1]!
          const grow = f === fNow ? Math.max(0.08, blend) : 1
          const h = Cv * grow
          ctx.fillStyle = f === fNow ? '#38bdf8' : 'rgba(100,116,139,0.55)'
          ctx.fillRect(sx(f - 0.3), sy(h), sx(f + 0.3) - sx(f - 0.3), sy(0) - sy(h))
        }
      }
      // 自由度槽：播放时逐个点亮
      const slotY = -0.15
      for (let i = 1; i <= fNow; i++) {
        const x = 2.6 + (i - 1) * 0.55
        const on = i <= lit
        ctx.beginPath()
        ctx.arc(sx(x), sy(slotY), 7, 0, Math.PI * 2)
        ctx.fillStyle = on ? '#f472b6' : 'rgba(51,65,85,0.9)'
        ctx.fill()
        ctx.strokeStyle = on ? 'rgba(251,191,36,0.9)' : 'rgba(148,163,184,0.35)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(520, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `均分 · f=${fNow}  已点亮=${lit}  U=${Number(snap.values.U ?? 0).toFixed(2)}  Cv=${Number(snap.values.Cv ?? 0).toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '播放：自由度逐个获得 ½T · 柱高∝Cv(f)', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [5, 3.2, 0],
        yaw: 0.55,
        pitch: 0.4,
        distance: 16,
        distanceMin: 6,
        distanceMax: 30,
      })
      bars3d.length = 0
      dofSpheres.length = 0
      for (let f = 3; f <= 7; f++) {
        const Cv = (f / 2) * 2
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, Math.max(0.2, Cv), 0.7),
          new THREE.MeshStandardMaterial({
            color: f === 5 ? 0x38bdf8 : 0x64748b,
            metalness: 0.2,
            roughness: 0.45,
          }),
        )
        mesh.position.set(f, Cv / 2, 0)
        host.scene.add(mesh)
        bars3d.push(mesh)
      }
      for (let i = 0; i < 7; i++) {
        const s = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 12, 10),
          new THREE.MeshStandardMaterial({
            color: 0xf472b6,
            emissive: 0x9d174d,
            emissiveIntensity: 0.3,
          }),
        )
        s.position.set(2.8 + i * 0.55, 8.2, 0.6)
        s.visible = false
        host.scene.add(s)
        dofSpheres.push(s)
      }
    },
    paint3d(host, snap) {
      const fNow = Number(snap.values.f ?? 5)
      const lit = Number(snap.values.lit ?? 0)
      const blend = Number(snap.values.blend ?? 0)
      for (let i = 0; i < bars3d.length; i++) {
        const f = 3 + i
        const Cv = (f / 2) * 2
        const mesh = bars3d[i]!
        const grow = f === fNow ? Math.max(0.08, blend) : 1
        const h = Math.max(0.15, Cv * grow)
        mesh.scale.set(1, h / Math.max(0.2, Cv), 1)
        mesh.position.y = h / 2
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.color.setHex(f === fNow ? 0x38bdf8 : 0x64748b)
      }
      for (let i = 0; i < dofSpheres.length; i++) {
        const s = dofSpheres[i]!
        const on = i < lit && i < fNow
        s.visible = on
        s.position.set(2.8 + i * 0.55, 8.2, 0.6)
      }
      host.render()
    },
    dispose3d() {
      bars3d.length = 0
      dofSpheres.length = 0
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
