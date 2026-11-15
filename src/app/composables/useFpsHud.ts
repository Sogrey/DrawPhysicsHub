import { onUnmounted, ref } from 'vue'

/** 轻量 FPS：由主循环 tick() 驱动，默认不显示 */
export function useFpsHud() {
  const showFps = ref(false)
  const fps = ref(0)
  let frames = 0
  let last = performance.now()

  function tick() {
    if (!showFps.value) return
    frames += 1
    const now = performance.now()
    if (now - last >= 500) {
      fps.value = Math.round((frames * 1000) / (now - last))
      frames = 0
      last = now
    }
  }

  function toggle() {
    showFps.value = !showFps.value
    if (showFps.value) {
      frames = 0
      last = performance.now()
      fps.value = 0
    }
  }

  onUnmounted(() => {
    showFps.value = false
  })

  return { showFps, fps, tick, toggle }
}
