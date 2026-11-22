<script setup lang="ts">
defineProps<{
  playing: boolean
  speed: number
  loop?: boolean
  canScrub?: boolean
  t?: number
  tMax?: number
  showCompare?: boolean
  hasCompare?: boolean
}>()

const emit = defineEmits<{
  play: []
  pause: []
  reset: []
  'update:speed': [number]
  'update:loop': [boolean]
  scrub: [Event]
  keepCompare: []
  clearCompare: []
}>()
</script>

<template>
  <div class="playback-bar">
    <div class="controls">
      <button
        type="button"
        class="primary"
        :title="playing ? '暂停 (Space)' : '播放 (Space)'"
        @click="playing ? emit('pause') : emit('play')"
      >
        {{ playing ? '暂停' : '播放' }}
      </button>
      <button type="button" title="复位 (R / Home)" @click="emit('reset')">复位</button>
      <div class="playback-opts">
        <label class="speed">
          倍率
          <select
            :value="speed"
            @change="emit('update:speed', Number(($event.target as HTMLSelectElement).value))"
          >
            <option :value="0.5">0.5×</option>
            <option :value="1">1×</option>
            <option :value="2">2×</option>
          </select>
        </label>
        <label class="loop-toggle" title="到达周期末尾后自动复位并继续播放">
          <input
            type="checkbox"
            :checked="loop"
            @change="emit('update:loop', ($event.target as HTMLInputElement).checked)"
          />
          循环
        </label>
      </div>
    </div>

    <label v-if="canScrub && tMax != null && t != null" class="scrub">
      <div class="param-top">
        <span>时间轴 t</span>
        <strong>{{ t.toFixed(2) }} / {{ tMax.toFixed(2) }} s</strong>
      </div>
      <input
        type="range"
        :min="0"
        :max="tMax"
        :step="0.01"
        :value="t"
        @input="emit('scrub', $event)"
      />
    </label>

    <div v-if="showCompare" class="compare-actions">
      <button type="button" @click="emit('keepCompare')">保留对比</button>
      <button type="button" :disabled="!hasCompare" @click="emit('clearCompare')">清除对比</button>
    </div>
  </div>
</template>
