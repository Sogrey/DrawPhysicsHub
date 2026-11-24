import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawArrow, drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import * as THREE from 'three'

function drawClock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  ang: number,
  color: string,
  label: string,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + r * 0.75 * Math.sin(ang), cy - r * 0.75 * Math.cos(ang))
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, cx, cy + r + 16)
  ctx.restore()
}

export function createTimeDilationAdapter(): DemoAdapter {
  let rod: THREE.Mesh | null = null
  let clockP: THREE.Mesh | null = null
  let clockL: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -3.2, xMax: 3.2, yMin: -2.2, yMax: 2.4 }, W, H)
      const gamma = Number(snap.values.gamma ?? 1)
      const L0 = Number(snap.values.L0 ?? 2)
      const L = Number(snap.values.L ?? L0)
      const angP = Number(snap.values.angProper ?? 0)
      const angLab = Number(snap.values.tLab ?? 0) * ((2 * Math.PI) / Number(snap.values.period ?? 8))
      const xC = Number(snap.values.xC ?? 0)

      drawClock(ctx, sx(-1.6), sy(1.1), 36, angP, '#38bdf8', `固有 τ=${Number(snap.values.tau ?? 0).toFixed(1)}`)
      drawClock(ctx, sx(1.6), sy(1.1), 36, angLab, '#fbbf24', `实验室 t=${Number(snap.values.tLab ?? 0).toFixed(1)}`)

      // 静长参考（虚线）
      ctx.save()
      ctx.setLineDash([5, 4])
      ctx.strokeStyle = 'rgba(148,163,184,0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(sx(xC - L0 / 2), sy(-0.6))
      ctx.lineTo(sx(xC + L0 / 2), sy(-0.6))
      ctx.stroke()
      ctx.restore()
      drawDiagramLabel(ctx, `L₀=${L0.toFixed(1)}`, sx(xC), sy(-0.35), { color: '#94a3b8', font: '11px sans-serif' })

      // 运动杆
      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(sx(xC - L / 2), sy(-1.1))
      ctx.lineTo(sx(xC + L / 2), sy(-1.1))
      ctx.stroke()
      drawDiagramLabel(ctx, `L=${L.toFixed(2)} (=L₀/γ)`, sx(xC), sy(-1.55), {
        color: '#c4b5fd',
        font: '11px sans-serif',
      })
      drawArrow(ctx, sx(-2.6), sy(-1.1), sx(-2.1), sy(-1.1), '#f472b6', 2.5)
      drawDiagramLabel(ctx, 'v', sx(-2.35), sy(-1.35), { color: '#f472b6', font: '11px sans-serif' })

      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(480, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `时胀/尺缩 · β=${Number(snap.values.beta ?? 0).toFixed(2)}  γ=${gamma.toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '运动钟变慢；沿运动方向长度收缩', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({ lookAt: [0, 0, 0], yaw: 0.5, pitch: 0.35, distance: 9, distanceMin: 3, distanceMax: 18 })
      rod = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.15, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xa78bfa }),
      )
      clockP = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8 }),
      )
      clockL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 }),
      )
      clockP.rotation.x = Math.PI / 2
      clockL.rotation.x = Math.PI / 2
      clockP.position.set(-1.5, 0.8, 0)
      clockL.position.set(1.5, 0.8, 0)
      host.scene.add(rod)
      host.scene.add(clockP)
      host.scene.add(clockL)
    },
    paint3d(host, snap) {
      if (rod) {
        const L = Number(snap.values.L ?? 2)
        const xC = Number(snap.values.xC ?? 0)
        rod.scale.set(L / 2, 1, 1)
        rod.position.set(xC, -0.5, 0)
      }
      host.render()
    },
    dispose3d() {
      rod = null
      clockP = null
      clockL = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
