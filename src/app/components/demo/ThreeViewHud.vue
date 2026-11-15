<script setup lang="ts">
defineProps<{
  autoRotate: boolean
}>()

const emit = defineEmits<{
  resetView: []
  toggleAutoRotate: []
}>()
</script>

<template>
  <div class="three-view-hud">
    <div class="hud-bar">
      <button type="button" @click="emit('resetView')">重置视角</button>
      <button type="button" :class="{ on: autoRotate }" @click="emit('toggleAutoRotate')">
        {{ autoRotate ? '停止旋转' : '自动旋转' }}
      </button>
    </div>
    <div class="hud-hint">拖拽旋转 · 右键/Shift+拖拽平移 · 滚轮缩放</div>
  </div>
</template>
