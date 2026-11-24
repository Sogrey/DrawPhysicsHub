export interface Canvas2DHost {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  resize(): void
  clear(): void
  /** 滚轮缩放 / 拖拽平移后重绘 */
  setOnViewChange(cb: (() => void) | null): void
  resetView(): void
  dispose(): void
}

const ZOOM_MIN = 0.4
const ZOOM_MAX = 8

export function createCanvas2DHost(el: HTMLCanvasElement): Canvas2DHost {
  const ctxOrNull = el.getContext('2d')
  if (!ctxOrNull) throw new Error('2D context unavailable')
  const ctx: CanvasRenderingContext2D = ctxOrNull

  let zoom = 1
  let panX = 0
  let panY = 0
  let dragging = false
  let lastX = 0
  let lastY = 0
  let onViewChange: (() => void) | null = null

  const dpr = () => window.devicePixelRatio || 1

  function applyViewTransform() {
    const s = dpr()
    ctx.setTransform(s * zoom, 0, 0, s * zoom, s * panX, s * panY)
  }

  function notify() {
    onViewChange?.()
  }

  const resize = () => {
    const s = dpr()
    const w = el.clientWidth || 640
    const h = el.clientHeight || 360
    el.width = Math.floor(w * s)
    el.height = Math.floor(h * s)
    applyViewTransform()
  }

  resize()

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.button !== 1 && e.button !== 2) return
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    el.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    panX += dx
    panY += dy
    notify()
  }
  const onPointerUp = (e: PointerEvent) => {
    dragging = false
    try {
      el.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }
  const onContextMenu = (e: Event) => {
    e.preventDefault()
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const rect = el.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const prev = zoom
    const factor = Math.exp(-e.deltaY * 0.0012)
    const next = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev * factor))
    if (next === prev) return
    const cx = (mx - panX) / prev
    const cy = (my - panY) / prev
    zoom = next
    panX = mx - cx * zoom
    panY = my - cy * zoom
    notify()
  }
  const onDblClick = () => {
    zoom = 1
    panX = 0
    panY = 0
    notify()
  }

  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', onPointerUp)
  el.addEventListener('pointercancel', onPointerUp)
  el.addEventListener('contextmenu', onContextMenu)
  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('dblclick', onDblClick)

  return {
    canvas: el,
    ctx,
    resize,
    clear() {
      const s = dpr()
      const W = el.clientWidth
      const H = el.clientHeight
      // 先以屏幕坐标清屏 + 铺底，再套上视口变换（缩放/平移不露白边）
      ctx.setTransform(s, 0, 0, s, 0, 0)
      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#0b1220')
      bg.addColorStop(1, '#111827')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      applyViewTransform()
    },
    setOnViewChange(cb) {
      onViewChange = cb
    },
    resetView() {
      zoom = 1
      panX = 0
      panY = 0
      notify()
    },
    dispose() {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('contextmenu', onContextMenu)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('dblclick', onDblClick)
      onViewChange = null
    },
  }
}
