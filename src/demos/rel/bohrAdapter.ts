import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

export function createBohrAdapter(): DemoAdapter {
  let orbits: THREE.Line[] = []
  let electron: THREE.Mesh | null = null
  let nucleus: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -3.2, xMax: 3.4, yMin: -2.4, yMax: 2.6 }, W, H)

      // 轨道（左侧）
      const ox = -1.2
      const oy = 0.2
      for (let n = 1; n <= 5; n++) {
        const rr = n * n * 0.12
        ctx.strokeStyle = n === Number(snap.values.nNow ?? 1) ? 'rgba(56,189,248,0.95)' : 'rgba(71,85,105,0.7)'
        ctx.lineWidth = n === Number(snap.values.nNow ?? 1) ? 2.2 : 1.2
        ctx.beginPath()
        for (let i = 0; i <= 64; i++) {
          const a = (2 * Math.PI * i) / 64
          const x = ox + rr * Math.cos(a)
          const y = oy + rr * Math.sin(a)
          if (i === 0) ctx.moveTo(sx(x), sy(y))
          else ctx.lineTo(sx(x), sy(y))
        }
        ctx.stroke()
      }
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.arc(sx(ox), sy(oy), 5, 0, Math.PI * 2)
      ctx.fill()

      const r = Number(snap.values.r ?? 0.35)
      const ang = Number(snap.values.ang ?? 0)
      const ex = ox + r * Math.cos(ang)
      const ey = oy + r * Math.sin(ang)
      drawMarker(ctx, sx(ex), sy(ey), { radius: 5, fill: '#fbbf24', label: 'e⁻', labelDy: -12 })

      if (Number(snap.values.flash ?? 0) > 0.5) {
        ctx.strokeStyle = 'rgba(244,114,182,0.9)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(sx(ex), sy(ey))
        ctx.lineTo(sx(ex + 1.2), sy(ey + 0.9))
        ctx.stroke()
        drawDiagramLabel(ctx, 'γ', sx(ex + 1.0), sy(ey + 1.1), { color: '#f472b6', font: 'bold 12px sans-serif' })
      }

      // 能级（右侧）
      const levels = snap.trails?.levels
      if (levels) {
        for (const lv of levels) {
          const n = lv[0]!
          const E = lv[1]!
          const y = -0.2 + ((E + 13.6) / 13.6) * 2.2
          const x0 = 1.2
          const x1 = 2.8
          const hi = n === Number(snap.values.ni ?? 0)
          const lo = n === Number(snap.values.nf ?? 0)
          ctx.strokeStyle = hi || lo ? '#fbbf24' : 'rgba(148,163,184,0.55)'
          ctx.lineWidth = hi || lo ? 2.4 : 1.2
          ctx.beginPath()
          ctx.moveTo(sx(x0), sy(y))
          ctx.lineTo(sx(x1), sy(y))
          ctx.stroke()
          drawDiagramLabel(ctx, `n=${n}  ${E.toFixed(1)}eV`, sx(x1 + 0.15), sy(y + 0.08), {
            color: hi || lo ? '#fde68a' : '#94a3b8',
            font: '10px sans-serif',
          })
        }
        // 跃迁箭头
        const yi = -0.2 + ((Number(snap.values.Ei ?? 0) + 13.6) / 13.6) * 2.2
        const yf = -0.2 + ((Number(snap.values.Ef ?? 0) + 13.6) / 13.6) * 2.2
        ctx.strokeStyle = '#f472b6'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(sx(2.0), sy(yi))
        ctx.lineTo(sx(2.0), sy(yf))
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(500, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `玻尔 · n=${Number(snap.values.ni ?? 0)}→${Number(snap.values.nf ?? 0)}  ΔE=${Number(snap.values.dE ?? 0).toFixed(2)} eV`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '左轨道 · 右能级；播放：绕轨→跃迁发光', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.6, pitch: 0.45, distance: 8, distanceMin: 3, distanceMax: 16 })
      nucleus = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0x64748b, emissiveIntensity: 0.3 }),
      )
      electron = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xb45309, emissiveIntensity: 0.4 }),
      )
      host.scene.add(nucleus)
      host.scene.add(electron)
      for (let n = 1; n <= 5; n++) {
        const pts: THREE.Vector3[] = []
        const rr = n * n * 0.12
        for (let i = 0; i <= 64; i++) {
          const a = (2 * Math.PI * i) / 64
          pts.push(new THREE.Vector3(rr * Math.cos(a), rr * Math.sin(a), 0))
        }
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 }),
        )
        orbits.push(line)
        host.scene.add(line)
      }
    },
    paint3d(host, snap) {
      if (electron) {
        const r = Number(snap.values.r ?? 0.35)
        const ang = Number(snap.values.ang ?? 0)
        electron.position.set(r * Math.cos(ang), r * Math.sin(ang), 0)
      }
      host.render()
    },
    dispose3d() {
      orbits = []
      electron = null
      nucleus = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
