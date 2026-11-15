import { computed, reactive, ref } from 'vue'

/** 视口内可拖拽 HUD（默认右上角） */
export function useDraggableHud(defaultTop = 12) {
  const pos = reactive({ x: null as number | null, y: defaultTop })
  const dragging = ref(false)
  const elRef = ref<HTMLElement | null>(null)

  let dragOffsetX = 0
  let dragOffsetY = 0
  let hostEl: HTMLElement | null = null

  const style = computed(() => {
    if (pos.x === null) {
      return { top: `${pos.y}px`, right: '12px', left: 'auto' }
    }
    return { top: `${pos.y}px`, left: `${pos.x}px`, right: 'auto' }
  })

  function clamp(x: number, y: number, host: HTMLElement, el: HTMLElement) {
    const maxX = Math.max(0, host.clientWidth - el.offsetWidth - 4)
    const maxY = Math.max(0, host.clientHeight - el.offsetHeight - 4)
    return {
      x: Math.min(maxX, Math.max(0, x)),
      y: Math.min(maxY, Math.max(0, y)),
    }
  }

  function onPointerDown(e: PointerEvent) {
    const el = elRef.value
    if (!el) return
    const host = el.parentElement
    if (!host) return
    hostEl = host
    dragging.value = true
    const rect = el.getBoundingClientRect()
    const hostRect = host.getBoundingClientRect()
    if (pos.x === null) {
      pos.x = rect.left - hostRect.left
      pos.y = rect.top - hostRect.top
    }
    dragOffsetX = e.clientX - rect.left
    dragOffsetY = e.clientY - rect.top
    el.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging.value || pos.x === null) return
    const el = elRef.value
    const host = hostEl
    if (!el || !host) return
    const hostRect = host.getBoundingClientRect()
    const next = clamp(
      e.clientX - hostRect.left - dragOffsetX,
      e.clientY - hostRect.top - dragOffsetY,
      host,
      el,
    )
    pos.x = next.x
    pos.y = next.y
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging.value) return
    dragging.value = false
    elRef.value?.releasePointerCapture(e.pointerId)
    hostEl = null
  }

  return {
    elRef,
    pos,
    dragging,
    style,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
