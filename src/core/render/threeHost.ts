import * as THREE from 'three'

export interface ThreeHost {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  resize(): void
  render(): void
  dispose(): void
  setAutoRotate(on: boolean): void
  resetView(): void
}

export function createThreeHost(canvas: HTMLCanvasElement): ThreeHost {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b1220)
  scene.fog = new THREE.Fog(0x0b1220, 80, 180)

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)
  const lookAt = new THREE.Vector3(18, 4, 0)
  let yaw = 0.55
  let pitch = 0.42
  let distance = 70
  let autoRotate = false
  let dragging = false
  let lastX = 0
  let lastY = 0
  let rafOrbit = 0

  function applyCamera() {
    camera.position.set(
      lookAt.x + distance * Math.cos(pitch) * Math.sin(yaw),
      lookAt.y + distance * Math.sin(pitch),
      lookAt.z + distance * Math.cos(pitch) * Math.cos(yaw),
    )
    camera.lookAt(lookAt)
  }
  applyCamera()

  const light = new THREE.DirectionalLight(0xffffff, 1.15)
  light.position.set(30, 50, 20)
  scene.add(light)
  scene.add(new THREE.AmbientLight(0x94a3b8, 0.55))
  scene.add(new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.35))

  const grid = new THREE.GridHelper(100, 20, 0x1e3a5f, 0x152238)
  scene.add(grid)

  scene.add(createLabeledAxes(28))

  const onPointerDown = (e: PointerEvent) => {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    canvas.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    yaw -= dx * 0.008
    pitch = Math.max(-0.2, Math.min(1.2, pitch + dy * 0.008))
    applyCamera()
    renderer.render(scene, camera)
  }
  const onPointerUp = (e: PointerEvent) => {
    dragging = false
    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    distance = Math.max(20, Math.min(140, distance + e.deltaY * 0.04))
    applyCamera()
    renderer.render(scene, camera)
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })

  const tickOrbit = () => {
    if (autoRotate) {
      yaw += 0.004
      applyCamera()
      renderer.render(scene, camera)
    }
    rafOrbit = requestAnimationFrame(tickOrbit)
  }
  rafOrbit = requestAnimationFrame(tickOrbit)

  const resize = () => {
    const w = canvas.clientWidth || 640
    const h = canvas.clientHeight || 360
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  return {
    renderer,
    scene,
    camera,
    resize,
    render() {
      renderer.render(scene, camera)
    },
    setAutoRotate(on: boolean) {
      autoRotate = on
    },
    resetView() {
      yaw = 0.55
      pitch = 0.42
      distance = 70
      applyCamera()
      renderer.render(scene, camera)
    },
    dispose() {
      cancelAnimationFrame(rafOrbit)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
          else mat.dispose()
        }
      })
      renderer.dispose()
    },
  }
}

/** 带 x/y/z 轴标的三维坐标系 */
function createLabeledAxes(size = 24): THREE.Group {
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

export function syncProjectileThree(
  host: ThreeHost,
  ball: THREE.Mesh,
  line: THREE.Line,
  snap: { x: number; y: number; path: number[][] },
): void {
  ball.position.set(snap.x, Math.max(0, snap.y), 0)
  const positions = new Float32Array(Math.max(snap.path.length, 1) * 3)
  for (let i = 0; i < snap.path.length; i++) {
    positions[i * 3] = snap.path[i]![0]!
    positions[i * 3 + 1] = snap.path[i]![1]!
    positions[i * 3 + 2] = 0
  }
  line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  line.geometry.setDrawRange(0, snap.path.length)
  line.geometry.attributes.position!.needsUpdate = true
  host.render()
}
