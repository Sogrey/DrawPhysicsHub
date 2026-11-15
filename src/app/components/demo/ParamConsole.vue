<script setup lang="ts">
import type { ParamDef, ParamValues } from '@/core/physics/types'

defineProps<{
  paramsDef: ParamDef[]
  params: ParamValues
}>()

const emit = defineEmits<{ change: [] }>()
</script>

<template>
  <div class="params">
    <label v-for="p in paramsDef" :key="p.key" class="param">
      <div class="param-top">
        <span>{{ p.label }} <small v-if="p.unit">({{ p.unit }})</small></span>
        <strong v-if="p.kind === 'number'">{{ params[p.key] }}</strong>
      </div>
      <input
        v-if="p.kind === 'number'"
        type="range"
        :min="p.min"
        :max="p.max"
        :step="p.step ?? 1"
        v-model.number="params[p.key] as number"
        @input="emit('change')"
      />
    </label>
  </div>
</template>
