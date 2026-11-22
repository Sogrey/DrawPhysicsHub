import * as THREE from 'three'

/** 简易文字精灵（示意标签） */
export function createTextSprite(
  text: string,
  opts?: { color?: string; fontSize?: number; scale?: number },
): THREE.Sprite {
  const color = opts?.color ?? '#e2e8f0'
  const fontSize = opts?.fontSize ?? 42
  const scale = opts?.scale ?? 1.6
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 256, 64)
  ctx.font = `bold ${fontSize}px Segoe UI, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.strokeText(text, 128, 34)
  ctx.fillStyle = color
  ctx.fillText(text, 128, 34)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  )
  sprite.scale.set(scale * 2.2, scale * 0.55, 1)
  return sprite
}

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
