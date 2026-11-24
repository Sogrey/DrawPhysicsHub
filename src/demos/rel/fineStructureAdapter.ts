import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

export function createFineStructureAdapter(): DemoAdapter {
  let coarse: THREE.Line | null = null
  let lo: THREE.Line | null = null
  let hi: THREE.Line | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const { sx, sy } = drawGridAndAxes2D(ctx, { xMin: -1.4, xMax: 1.4, yMin: -1.15, yMax: 0.35 }, W, H)
      const yCoarse = Number(snap.values.yCoarse ?? -0.55)
      const yLo = Number(snap.values.yLo ?? yCoarse)
      const yHi = Number(snap.values.yHi ?? yCoarse)
      const blend = Number(snap.values.blend ?? 0)

      ctx.strokeStyle = 'rgba(148,163,184,0.9)'
      ctx.lineWidth = 3.2
      ctx.beginPath()
      ctx.moveTo(sx(-0.55), sy(yCoarse))
      ctx.lineTo(sx(0.55), sy(yCoarse))
      ctx.stroke()

      if (blend > 0.02) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 2.6
        ctx.beginPath()
        ctx.moveTo(sx(-1.15), sy(yLo))
        ctx.lineTo(sx(-0.25), sy(yLo))
        ctx.moveTo(sx(0.25), sy(yHi))
        ctx.lineTo(sx(1.15), sy(yHi))
        ctx.stroke()
        // 连接虚线
        ctx.strokeStyle = 'rgba(251,191,36,0.45)'
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(sx(-0.25), sy(yLo))
        ctx.lineTo(sx(0), sy(yCoarse))
        ctx.lineTo(sx(0.25), sy(yHi))
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(500, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `精细结构 · n=${Number(snap.values.n ?? 0)}  分裂=${Number(snap.values.split ?? 0).toExponential(2)}  张开=${(blend * 100).toFixed(0)}%`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '播放：粗能级 → j 子能级劈开（间距已教学放大）', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [0, -0.45, 0],
        yaw: 0.45,
        pitch: 0.35,
        distance: 5.5,
        distanceMin: 2.5,
        distanceMax: 12,
      })
      coarse = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x94a3b8 }))
      lo = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      hi = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      host.scene.add(coarse)
      host.scene.add(lo)
      host.scene.add(hi)
    },
    paint3d(host, snap) {
      const yCoarse = Number(snap.values.yCoarse ?? -0.55)
      const yLo = Number(snap.values.yLo ?? yCoarse)
      const yHi = Number(snap.values.yHi ?? yCoarse)
      const blend = Number(snap.values.blend ?? 0)
      if (coarse) setTrailPositions(coarse, [[-0.55, yCoarse, 0], [0.55, yCoarse, 0]])
      if (lo) {
        if (blend > 0.02) setTrailPositions(lo, [[-1.15, yLo, 0], [-0.25, yLo, 0]])
        else setTrailPositions(lo, [[0, yCoarse, 0], [0, yCoarse, 0]])
      }
      if (hi) {
        if (blend > 0.02) setTrailPositions(hi, [[0.25, yHi, 0], [1.15, yHi, 0]])
        else setTrailPositions(hi, [[0, yCoarse, 0], [0, yCoarse, 0]])
      }
      host.render()
    },
    dispose3d() {
      coarse = null
      lo = null
      hi = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
