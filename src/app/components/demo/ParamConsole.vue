<script setup lang="ts">
import type { ParamDef, ParamValues, SelectParam } from '@/core/physics/types'

defineProps<{
  paramsDef: ParamDef[]
  params: ParamValues
}>()

const emit = defineEmits<{ change: [] }>()

function selectOptions(p: ParamDef) {
  return (p as SelectParam).options ?? []
}
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
      <select
        v-else-if="p.kind === 'select'"
        class="param-select"
        :value="String(params[p.key] ?? p.default)"
        @change="
          params[p.key] = ($event.target as HTMLSelectElement).value;
          emit('change')
        "
      >
        <option v-for="opt in selectOptions(p)" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <input
        v-else-if="p.kind === 'boolean'"
        type="checkbox"
        :checked="Boolean(params[p.key])"
        @change="
          params[p.key] = ($event.target as HTMLInputElement).checked;
          emit('change')
        "
      />
    </label>
  </div>
</template>

<style scoped>
.param-select {
  width: 100%;
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.85);
  color: #e2e8f0;
  font-size: 12px;
}
</style>
