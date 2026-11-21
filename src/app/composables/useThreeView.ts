import { ref, type Ref } from 'vue'
import type { CameraViewPreset } from '@/core/physics/types'
import { createThreeHost, type ThreeHost, type ThreeViewDefaults } from '@/core/render/threeHost'

/** Three host + 自动旋转状态 */
export function useThreeView() {
  const canvasEl: Ref<HTMLCanvasElement | null> = ref(null)
  const autoRotate = ref(false)
  let host: ThreeHost | null = null

  function setup() {
    if (!canvasEl.value) return null
    host?.dispose()
    host = createThreeHost(canvasEl.value)
    host.setAutoRotate(autoRotate.value)
    return host
  }

  function resize() {
    host?.resize()
  }

  function toggleAutoRotate() {
    autoRotate.value = !autoRotate.value
    host?.setAutoRotate(autoRotate.value)
  }

  function resetView() {
    host?.resetView()
  }

  function applyPreset(preset: CameraViewPreset) {
    const opts: ThreeViewDefaults = {
      lookAt: preset.lookAt,
      yaw: preset.yaw,
      pitch: preset.pitch,
      distance: preset.distance,
    }
    host?.applyView(opts)
  }

  function dispose() {
    host?.dispose()
    host = null
  }

  function getHost() {
    return host
  }

  return {
    canvasEl,
    autoRotate,
    setup,
    resize,
    toggleAutoRotate,
    resetView,
    applyPreset,
    dispose,
    getHost,
  }
}
