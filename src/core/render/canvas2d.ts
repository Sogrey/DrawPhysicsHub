export interface Canvas2DHost {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  resize(): void
  clear(): void
  dispose(): void
}

export function createCanvas2DHost(el: HTMLCanvasElement): Canvas2DHost {
  const ctx = el.getContext('2d')
  if (!ctx) throw new Error('2D context unavailable')

  const resize = () => {
    const dpr = window.devicePixelRatio || 1
    const w = el.clientWidth || 640
    const h = el.clientHeight || 360
    el.width = Math.floor(w * dpr)
    el.height = Math.floor(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  resize()

  return {
    canvas: el,
    ctx,
    resize,
    clear() {
      ctx.clearRect(0, 0, el.clientWidth, el.clientHeight)
    },
    dispose() {
      /* noop */
    },
  }
}
