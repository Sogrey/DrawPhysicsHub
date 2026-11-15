<script setup lang="ts">
import type { DemoView } from '@/core/physics/types'

defineProps<{
  views: DemoView[]
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="stage-toolbar">
    <div class="tabs">
      <button
        v-for="v in views"
        :key="v.id"
        type="button"
        :class="{ active: modelValue === v.id }"
        @click="emit('update:modelValue', v.id)"
      >
        {{ v.title }}
      </button>
    </div>
    <div class="stage-actions">
      <slot name="actions" />
    </div>
  </div>
</template>
