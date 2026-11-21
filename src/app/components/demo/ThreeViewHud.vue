<script setup lang="ts">
import type { CameraViewPreset } from '@/core/physics/types'

defineProps<{
  autoRotate: boolean
  presets?: CameraViewPreset[]
  hint?: string
}>()

const emit = defineEmits<{
  resetView: []
  toggleAutoRotate: []
  applyPreset: [preset: CameraViewPreset]
}>()
</script>

<template>
  <div class="three-view-hud">
    <div class="hud-bar">
      <button type="button" @click="emit('resetView')">重置视角</button>
      <button type="button" :class="{ on: autoRotate }" @click="emit('toggleAutoRotate')">
        {{ autoRotate ? '停止旋转' : '自动旋转' }}
      </button>
      <button
        v-for="p in presets ?? []"
        :key="p.id"
        type="button"
        class="preset"
        :title="p.label"
        @click="emit('applyPreset', p)"
      >
        {{ p.label }}
      </button>
    </div>
    <div class="hud-hint">
      {{ hint || '拖拽旋转 · 右键/Shift+拖拽平移 · 滚轮缩放' }}
    </div>
  </div>
</template>

<style scoped>
.preset {
  border-color: rgba(167, 139, 250, 0.45);
  color: #c4b5fd;
}
</style>
