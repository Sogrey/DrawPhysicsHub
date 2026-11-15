import * as THREE from 'three'
import { createLabeledAxes } from '@/core/render/primitives3d'

export interface ThreeViewDefaults {
  lookAt?: [number, number, number]
  yaw?: number
  pitch?: number
  distance?: number
  distanceMin?: number
  distanceMax?: number
}

export interface ThreeHost {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  resize(): void
  render(): void
  dispose(): void
  setAutoRotate(on: boolean): void
  resetView(): void
  /** demo adapter 按场景尺度取景（简谐近景 / 抛体远景） */
  setViewDefaults(opts: ThreeViewDefaults): void
}

export function createThreeHost(canvas: HTMLCanvasElement): ThreeHost {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b1220)
  scene.fog = new THREE.Fog(0x0b1220, 80, 180)

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)
  const defaultLookAt = new THREE.Vector3(18, 4, 0)
  const lookAt = defaultLookAt.clone()
  let defaultYaw = 0.55
  let defaultPitch = 0.42
  let defaultDistance = 70
  let yaw = defaultYaw
  let pitch = defaultPitch
  let distance = defaultDistance
  let distanceMin = 4
  let distanceMax = 140
  let autoRotate = false
  let dragMode: 'orbit' | 'pan' | null = null
  let lastX = 0
  let lastY = 0
  let rafOrbit = 0
  const panRight = new THREE.Vector3()
  const panUp = new THREE.Vector3()

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

  function isPanGesture(e: PointerEvent) {
    // 右键 / 中键 / Shift+左键 → 平移
    return e.button === 2 || e.button === 1 || (e.button === 0 && e.shiftKey)
  }

  const onPointerDown = (e: PointerEvent) => {
    dragMode = isPanGesture(e) ? 'pan' : e.button === 0 ? 'orbit' : null
    if (!dragMode) return
    lastX = e.clientX
    lastY = e.clientY
    canvas.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragMode) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    if (dragMode === 'orbit') {
      yaw -= dx * 0.008
      pitch = Math.max(-0.2, Math.min(1.2, pitch + dy * 0.008))
    } else {
      // 沿相机右/上方向平移注视点
      panRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
      panUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize()
      const scale = distance * 0.0018
      lookAt.addScaledVector(panRight, -dx * scale)
      lookAt.addScaledVector(panUp, dy * scale)
    }
    applyCamera()
    renderer.render(scene, camera)
  }
  const onPointerUp = (e: PointerEvent) => {
    dragMode = null
    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }
  const onContextMenu = (e: Event) => {
    e.preventDefault()
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    distance = Math.max(distanceMin, Math.min(distanceMax, distance + e.deltaY * 0.04))
    applyCamera()
    renderer.render(scene, camera)
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('contextmenu', onContextMenu)
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
    setViewDefaults(opts: ThreeViewDefaults) {
      if (opts.lookAt) defaultLookAt.set(...opts.lookAt)
      if (opts.yaw != null) defaultYaw = opts.yaw
      if (opts.pitch != null) defaultPitch = opts.pitch
      if (opts.distance != null) defaultDistance = opts.distance
      if (opts.distanceMin != null) distanceMin = opts.distanceMin
      if (opts.distanceMax != null) distanceMax = opts.distanceMax
      yaw = defaultYaw
      pitch = defaultPitch
      distance = defaultDistance
      lookAt.copy(defaultLookAt)
      applyCamera()
      renderer.render(scene, camera)
    },
    resetView() {
      yaw = defaultYaw
      pitch = defaultPitch
      distance = defaultDistance
      lookAt.copy(defaultLookAt)
      applyCamera()
      renderer.render(scene, camera)
    },
    dispose() {
      cancelAnimationFrame(rafOrbit)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('contextmenu', onContextMenu)
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

export { createLabeledAxes } from '@/core/render/primitives3d'
