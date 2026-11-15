<script setup lang="ts">
import KatexFormula from '@/app/components/KatexFormula.vue'

defineProps<{
  conceptParagraphs: string[]
  objectives?: string[]
  formulas?: string[]
}>()
</script>

<template>
  <div class="viewport docs">
    <section v-if="conceptParagraphs.length" class="docs-concept">
      <h2>概念解释</h2>
      <p v-for="(para, i) in conceptParagraphs" :key="i">{{ para }}</p>
    </section>
    <h2>教学目标</h2>
    <ul>
      <li v-for="(o, i) in objectives ?? []" :key="i">{{ o }}</li>
    </ul>
    <h2>公式</h2>
    <div class="formulas">
      <KatexFormula v-for="(f, i) in formulas ?? []" :key="i" :tex="f" display />
    </div>
  </div>
</template>
