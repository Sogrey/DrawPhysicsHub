import * as THREE from 'three'

export interface ParticleMeshOpts {
  radius?: number
  color?: number
  emissive?: number
  emissiveIntensity?: number
}

/** 质点球体样板（抛体 / 振动 / 碰撞可复用） */
export function createParticleMesh(opts?: ParticleMeshOpts): THREE.Mesh {
  const radius = opts?.radius ?? 0.7
  const color = opts?.color ?? 0xef4444
  const emissive = opts?.emissive ?? 0x7f1d1d
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 28, 20),
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.25,
      roughness: 0.35,
      emissive,
      emissiveIntensity: opts?.emissiveIntensity ?? 0.25,
    }),
  )
}

export function createTrailLine(color = 0x38bdf8): THREE.Line {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color }))
}

export function createDashedTrailLine(
  color = 0xf97316,
  opts?: { dashSize?: number; gapSize?: number; opacity?: number },
): THREE.Line {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3))
  return new THREE.Line(
    geo,
    new THREE.LineDashedMaterial({
      color,
      dashSize: opts?.dashSize ?? 1.2,
      gapSize: opts?.gapSize ?? 0.8,
      transparent: true,
      opacity: opts?.opacity ?? 0.7,
    }),
  )
}

/** 将 [[x,y],...] 或 [[x,y,z],...] 写入 Line geometry（z 缺省 0） */
export function setTrailPositions(line: THREE.Line, path: number[][]): void {
  const positions = new Float32Array(Math.max(path.length, 1) * 3)
  for (let i = 0; i < path.length; i++) {
    positions[i * 3] = path[i]![0]!
    positions[i * 3 + 1] = path[i]![1]!
    positions[i * 3 + 2] = path[i]![2] ?? 0
  }
  line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  line.geometry.setDrawRange(0, path.length)
  line.geometry.attributes.position!.needsUpdate = true
  const mat = line.material
  if (mat instanceof THREE.LineDashedMaterial) {
    line.computeLineDistances()
  }
}
