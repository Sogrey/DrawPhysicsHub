<script setup lang="ts">
defineProps<{
  hint?: string
}>()

const emit = defineEmits<{
  resetView: []
}>()
</script>

<template>
  <div class="canvas2d-view-hud">
    <div class="hud-bar">
      <button type="button" @click="emit('resetView')">重置视角</button>
    </div>
    <div class="hud-hint">
      {{ hint || '拖拽平移 · 滚轮缩放 · 双击复位' }}
    </div>
  </div>
</template>
