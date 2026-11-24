import type { DemoAdapter, DemoAdapterContext } from '@/core/physics/adapter'
import type { ObserveSnapshot } from '@/core/physics/types'
import type { Canvas2DHost } from '@/core/render/canvas2d'
import type { ThreeHost } from '@/core/render/threeHost'
import { drawDiagramLabel, drawGridAndAxes2D, drawMarker, fillDarkViewport } from '@/core/render/primitives2d'
import { setTrailPositions } from '@/core/render/particle3d'
import * as THREE from 'three'

function fitWorld(path: number[][] | undefined, mark?: { x: number; y: number }) {
  let x0 = Infinity
  let x1 = -Infinity
  let y0 = Infinity
  let y1 = -Infinity
  const consider = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    x0 = Math.min(x0, x)
    x1 = Math.max(x1, x)
    y0 = Math.min(y0, y)
    y1 = Math.max(y1, y)
  }
  for (const p of path ?? []) consider(p[0]!, p[1]!)
  if (mark) consider(mark.x, mark.y)
  if (!Number.isFinite(x0)) {
    return { xMin: 0, xMax: 4, yMin: -1, yMax: 3 }
  }
  // 保证原点附近轴可见，并给曲线留边距
  y0 = Math.min(y0, 0)
  y1 = Math.max(y1, 0.2)
  const dx = Math.max(0.35, x1 - x0)
  const dy = Math.max(0.6, y1 - y0)
  return {
    xMin: x0 - dx * 0.08,
    xMax: x1 + dx * 0.1,
    yMin: y0 - dy * 0.12,
    yMax: y1 + dy * 0.18,
  }
}

export function createVanderWaalsAdapter(): DemoAdapter {
  let line: THREE.Line | null = null
  let scan: THREE.Line | null = null
  let marker: THREE.Mesh | null = null

  return {
    paint2d(host: Canvas2DHost, snap: ObserveSnapshot, _c: DemoAdapterContext) {
      const { ctx, canvas } = host
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      host.clear()
      fillDarkViewport(ctx, W, H)
      const path = snap.trails?.path
      const Vmark = Number(snap.values.Vmark ?? 0)
      const Pmark = Number(snap.values.Pmark ?? 0)
      const world = fitWorld(path, { x: Vmark, y: Pmark })
      const { sx, sy } = drawGridAndAxes2D(ctx, world, W, H)
      if (path && path.length > 1) {
        // 全曲线淡描 + 已扫过段高亮
        ctx.strokeStyle = 'rgba(251,191,36,0.28)'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < path.length; i++) {
          const p = path[i]!
          if (i === 0) ctx.moveTo(sx(p[0]!), sy(p[1]!))
          else ctx.lineTo(sx(p[0]!), sy(p[1]!))
        }
        ctx.stroke()
        ctx.strokeStyle = 'rgba(251,191,36,0.95)'
        ctx.lineWidth = 2.4
        ctx.beginPath()
        let started = false
        for (let i = 0; i < path.length; i++) {
          const p = path[i]!
          if (p[0]! > Vmark) break
          if (!started) {
            ctx.moveTo(sx(p[0]!), sy(p[1]!))
            started = true
          } else ctx.lineTo(sx(p[0]!), sy(p[1]!))
        }
        if (started) ctx.lineTo(sx(Vmark), sy(Pmark))
        ctx.stroke()
      }
      drawMarker(ctx, sx(Vmark), sy(Pmark), { radius: 5, fill: '#f472b6' })
      ctx.fillStyle = 'rgba(15,23,42,0.92)'
      ctx.fillRect(12, 10, Math.min(460, W - 24), 48)
      drawDiagramLabel(
        ctx,
        `范德瓦尔斯 · T=${Number(snap.values.T ?? 0).toFixed(2)}  V=${Vmark.toFixed(2)}  P=${Pmark.toFixed(2)}`,
        22,
        28,
        { color: '#fde68a', font: 'bold 13px sans-serif' },
      )
      drawDiagramLabel(ctx, '横轴 V · 纵轴 P · 播放沿等温线扫 V', 22, 46, {
        color: 'rgba(226,232,240,0.88)',
        font: '11px sans-serif',
      })
    },
    setup3d(host: ThreeHost) {
      host.setViewDefaults({
        lookAt: [2, 0.6, 0],
        yaw: 0.55,
        pitch: 0.35,
        distance: 9,
        distanceMin: 3,
        distanceMax: 22,
      })
      line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35 }))
      scan = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xfbbf24 }))
      marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.35 }),
      )
      host.scene.add(line)
      host.scene.add(scan)
      host.scene.add(marker)
    },
    paint3d(host, snap) {
      const path = snap.trails?.path
      const Vmark = Number(snap.values.Vmark ?? 0)
      const Pmark = Number(snap.values.Pmark ?? 0)
      if (line && path?.length) setTrailPositions(line, path.map((p) => [p[0]!, p[1]!, 0]))
      if (scan && path?.length) {
        const scanned = path.filter((p) => p[0]! <= Vmark)
        scanned.push([Vmark, Pmark])
        setTrailPositions(scan, scanned.map((p) => [p[0]!, p[1]!, 0]))
      }
      if (marker) marker.position.set(Vmark, Pmark, 0)
      host.render()
    },
    dispose3d() {
      line = null
      scan = null
      marker = null
    },
    dispose() {
      this.dispose3d?.()
    },
  }
}
