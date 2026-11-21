import { afterEach, describe, expect, it, vi } from 'vitest'
import { useSimPlayback } from './useSimPlayback'

describe('useSimPlayback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exposes loop ref defaulting to false', () => {
    const { loop, stopLoop } = useSimPlayback({
      step: () => undefined,
      paint: () => undefined,
      isDone: () => false,
    })
    expect(loop.value).toBe(false)
    stopLoop()
  })

  it('restarts via loopRestart when loop is on and done', () => {
    let done = false
    let t = 0
    const loopRestart = vi.fn(() => {
      t = 0
      done = false
    })
    const paint = vi.fn()
    const holder: { cb: FrameRequestCallback | null } = { cb: null }
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      holder.cb = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      holder.cb = null
    })

    const { play, loop, stopLoop } = useSimPlayback({
      step: (dt) => {
        t += dt
        if (t >= 0.04) done = true
      },
      paint,
      isDone: () => done,
      loopRestart,
    })

    loop.value = true
    play()
    expect(holder.cb).toBeTruthy()
    holder.cb?.(0) // prime lastTs
    holder.cb?.(50) // dt capped 0.05 → done → loopRestart
    expect(loopRestart).toHaveBeenCalled()
    expect(paint).toHaveBeenCalled()
    expect(done).toBe(false)
    stopLoop()
  })

  it('stops when done and loop is off', () => {
    let done = false
    let t = 0
    const holder: { cb: FrameRequestCallback | null } = { cb: null }
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      holder.cb = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      holder.cb = null
    })

    const loopRestart = vi.fn()
    const { play, playing, loop, stopLoop } = useSimPlayback({
      step: (dt) => {
        t += dt
        if (t >= 0.04) done = true
      },
      paint: () => undefined,
      isDone: () => done,
      loopRestart,
    })

    loop.value = false
    play()
    holder.cb?.(0)
    holder.cb?.(50)
    expect(loopRestart).not.toHaveBeenCalled()
    expect(playing.value).toBe(false)
    stopLoop()
  })
})

