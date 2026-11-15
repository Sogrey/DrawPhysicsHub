<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { DemoLegendItem } from '@/core/physics/types'

defineProps<{
  items: DemoLegendItem[]
}>()

const rootEl = ref<HTMLElement | null>(null)
const pos = reactive({ x: null as number | null, y: 12 })
const dragging = ref(false)

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
  const el = rootEl.value
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
  const el = rootEl.value
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
  rootEl.value?.releasePointerCapture(e.pointerId)
  hostEl = null
}
</script>

<template>
  <div
    v-if="items.length"
    ref="rootEl"
    class="hud-legend"
    :class="{ dragging }"
    :style="style"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="hud-legend-title">图例 · 可拖拽</div>
    <div v-for="(item, i) in items" :key="i" class="hud-item">
      <i :style="{ background: item.color }" />
      {{ item.label }}
    </div>
  </div>
</template>
