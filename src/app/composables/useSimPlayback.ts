import { ref } from 'vue'

export interface SimPlaybackHooks {
  step: (dt: number) => void
  paint: () => void
  isDone: () => boolean
  /** 已播完再点播放时先复位（可选） */
  reset?: () => void
  /**
   * 循环模式下到达终点时重启（默认走 reset）。
   * 可只复位模型、不清图表缓存，避免每圈重采样。
   */
  loopRestart?: () => void
}

/** RAF 播放循环：播放 / 暂停 / 复位钩子 / 倍率 / 周期循环 */
export function useSimPlayback(hooks: SimPlaybackHooks) {
  const playing = ref(false)
  const speed = ref(1)
  const scrubbing = ref(false)
  /** 到 tMax / done 后自动复位并继续 */
  const loop = ref(false)

  let raf = 0
  let lastTs = 0
  let hasLastTs = false

  function restartForLoop() {
    ;(hooks.loopRestart ?? hooks.reset)?.()
  }

  function tick(ts: number) {
    if (!playing.value) {
      raf = 0
      return
    }
    if (!hasLastTs) {
      lastTs = ts
      hasLastTs = true
    }
    const dt = Math.min(0.05, ((ts - lastTs) / 1000) * speed.value)
    lastTs = ts
    hooks.step(dt)
    if (hooks.isDone() && loop.value) {
      restartForLoop()
    }
    hooks.paint()
    if (hooks.isDone() && !loop.value) {
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
    hasLastTs = false
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
    loop,
    play,
    pause,
    stopLoop,
  }
}
