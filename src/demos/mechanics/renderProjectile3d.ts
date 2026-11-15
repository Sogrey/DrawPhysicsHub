import type * as THREE from 'three'
import type { ThreeHost } from '@/core/render/threeHost'
import { setTrailPositions } from '@/core/render/particle3d'

export function syncProjectileThree(
  host: ThreeHost,
  ball: THREE.Mesh,
  line: THREE.Line,
  snap: { x: number; y: number; path: number[][] },
): void {
  ball.position.set(snap.x, Math.max(0, snap.y), 0)
  setTrailPositions(line, snap.path)
  host.render()
}

export function updateProjectileGhostLine(
  ghostLine: THREE.Line,
  snap: { values: Record<string, number | number[] | Float32Array> },
): void {
  const v0 = Number(snap.values.v0 ?? 20)
  const angle = Number(snap.values.angle ?? 45)
  const th = (angle * Math.PI) / 180
  const G = 9.8
  const T = (2 * v0 * Math.sin(th)) / G
  const n = 48
  const path: number[][] = []
  for (let i = 0; i <= n; i++) {
    const t = (T * i) / n
    path.push([
      v0 * Math.cos(th) * t,
      Math.max(0, v0 * Math.sin(th) * t - 0.5 * G * t * t),
      0,
    ])
  }
  setTrailPositions(ghostLine, path)
}
