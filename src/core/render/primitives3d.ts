import * as THREE from 'three'

/** 带 x/y/z 轴标的三维坐标系 */
export function createLabeledAxes(size = 24): THREE.Group {
  const group = new THREE.Group()
  const axes: Array<{ dir: THREE.Vector3; color: number; label: string }> = [
    { dir: new THREE.Vector3(1, 0, 0), color: 0xef4444, label: 'x' },
    { dir: new THREE.Vector3(0, 1, 0), color: 0x22c55e, label: 'y' },
    { dir: new THREE.Vector3(0, 0, 1), color: 0x3b82f6, label: 'z' },
  ]

  for (const a of axes) {
    const origin = new THREE.Vector3(0, 0, 0)
    const arrow = new THREE.ArrowHelper(a.dir, origin, size, a.color, size * 0.08, size * 0.05)
    group.add(arrow)

    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 64, 64)
    ctx.fillStyle = `#${a.color.toString(16).padStart(6, '0')}`
    ctx.font = 'bold 42px Segoe UI, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(a.label, 32, 34)
    const tex = new THREE.CanvasTexture(canvas)
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
    )
    sprite.scale.set(2.4, 2.4, 1)
    sprite.position.copy(a.dir.clone().multiplyScalar(size + 1.8))
    group.add(sprite)
  }

  return group
}
