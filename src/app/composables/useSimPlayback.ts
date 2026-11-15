import { ref } from 'vue'

export interface SimPlaybackHooks {
  step: (dt: number) => void
  paint: () => void
  isDone: () => boolean
  /** 已播完再点播放时先复位（可选） */
  reset?: () => void
}

/** RAF 播放循环：播放 / 暂停 / 复位钩子 / 倍率 */
export function useSimPlayback(hooks: SimPlaybackHooks) {
  const playing = ref(false)
  const speed = ref(1)
  const scrubbing = ref(false)

  let raf = 0
  let lastTs = 0

  function tick(ts: number) {
    if (!playing.value) {
      raf = 0
      return
    }
    if (!lastTs) lastTs = ts
    const dt = Math.min(0.05, ((ts - lastTs) / 1000) * speed.value)
    lastTs = ts
    hooks.step(dt)
    hooks.paint()
    if (hooks.isDone()) {
      playing.value = false
      raf = 0
      return
    }
    raf = requestAnimationFrame(tick)
  }

  function play() {
    scrubbing.value = false
    if (hooks.isDone()) {
      hooks.reset?.()
      hooks.paint()
    }
    playing.value = true
    lastTs = 0
    if (!raf) raf = requestAnimationFrame(tick)
  }

  function pause() {
    playing.value = false
  }

  function stopLoop() {
    pause()
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  return {
    playing,
    speed,
    scrubbing,
    play,
    pause,
    stopLoop,
  }
}
