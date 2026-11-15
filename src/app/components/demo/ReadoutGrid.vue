<script setup lang="ts">
export interface ReadoutItem {
  key: string
  label: string
  value: string
  tone?: string
}

defineProps<{
  items: ReadoutItem[]
  insight?: string
}>()
</script>

<template>
  <section class="panel">
    <header class="panel-h">实时读数</header>
    <dl class="readout-list">
      <div v-for="r in items" :key="r.key" class="row" :data-tone="r.tone ?? 'slate'">
        <dt>{{ r.label }}</dt>
        <dd>{{ r.value }}</dd>
      </div>
    </dl>
    <p v-if="insight" class="insight">{{ insight }}</p>
  </section>
</template>
