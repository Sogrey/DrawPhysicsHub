import { ref, type Ref } from 'vue'
import { createCanvas2DHost, type Canvas2DHost } from '@/core/render/canvas2d'

/** 2D canvas host 生命周期 */
export function useCanvas2DView() {
  const canvasEl: Ref<HTMLCanvasElement | null> = ref(null)
  let host: Canvas2DHost | null = null

  function setup() {
    if (!canvasEl.value) return null
    host?.dispose()
    host = createCanvas2DHost(canvasEl.value)
    return host
  }

  function resize() {
    host?.resize()
  }

  function dispose() {
    host?.dispose()
    host = null
  }

  function getHost() {
    return host
  }

  return { canvasEl, setup, resize, dispose, getHost }
}
